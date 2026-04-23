import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types/auth.types";
import { issueModel } from "../schemas/issue-schema";
import type { IssuePriority, IssueSeverity, IssueStatus } from "../models/issue-model";
import logger from "../utils/logger";

const STATUSES: IssueStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: IssuePriority[] = ["low", "medium", "high", "critical"];
const SEVERITIES: IssueSeverity[] = ["minor", "moderate", "major", "critical"];

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface IssueLean {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    status: IssueStatus;
    priority: IssuePriority;
    severity?: IssueSeverity | null;
    createdAt?: Date;
    updatedAt?: Date;
}

function toIssueDto(doc: IssueLean) {
    return {
        id: String(doc._id),
        title: doc.title,
        description: doc.description,
        status: doc.status,
        priority: doc.priority,
        severity: doc.severity ?? null,
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    };
}

export namespace IssueController {
    export async function stats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }
            const userId = new mongoose.Types.ObjectId(req.user.userId);
            const agg = await issueModel.aggregate<{ _id: IssueStatus; c: number }>([
                { $match: { userId } },
                { $group: { _id: "$status", c: { $sum: 1 } } },
            ]);
            const counts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
            for (const row of agg) {
                if (row._id in counts) counts[row._id as keyof typeof counts] = row.c;
            }
            res.status(200).json({ counts });
        } catch (error) {
            logger.error("Issue stats error", error);
            next(error);
        }
    }

    export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }
            const userId = new mongoose.Types.ObjectId(req.user.userId);
            const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
            const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
            const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
            const priority = typeof req.query.priority === "string" ? req.query.priority.trim() : "";
            const severity = typeof req.query.severity === "string" ? req.query.severity.trim() : "";

            const filter: Record<string, unknown> = { userId };
            if (q) {
                const rx = new RegExp(escapeRegex(q), "i");
                filter.$or = [{ title: rx }, { description: rx }];
            }
            if (status && STATUSES.includes(status as IssueStatus)) filter.status = status;
            if (priority && PRIORITIES.includes(priority as IssuePriority)) filter.priority = priority;
            if (severity && SEVERITIES.includes(severity as IssueSeverity)) filter.severity = severity;

            const [total, rows] = await Promise.all([
                issueModel.countDocuments(filter),
                issueModel
                    .find(filter)
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
            ]);

            res.status(200).json({
                issues: rows.map((r) => toIssueDto(r as IssueLean)),
                total,
                page,
                limit,
            });
        } catch (error) {
            logger.error("Issue list error", error);
            next(error);
        }
    }

    export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                res.status(400).json({ message: "Invalid issue id" });
                return;
            }
            const doc = await issueModel.findOne({ _id: id, userId: req.user.userId }).lean();
            if (!doc) {
                res.status(404).json({ message: "Issue not found" });
                return;
            }
            res.status(200).json({ issue: toIssueDto(doc) });
        } catch (error) {
            logger.error("Issue get error", error);
            next(error);
        }
    }

    export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }
            const { title, description, status, priority, severity } = req.body as Record<string, unknown>;
            if (typeof title !== "string" || !title.trim()) {
                res.status(400).json({ message: "Title is required" });
                return;
            }
            if (typeof description !== "string") {
                res.status(400).json({ message: "Description is required" });
                return;
            }
            const st = typeof status === "string" && STATUSES.includes(status as IssueStatus) ? (status as IssueStatus) : "open";
            const pr =
                typeof priority === "string" && PRIORITIES.includes(priority as IssuePriority)
                    ? (priority as IssuePriority)
                    : "medium";
            let sev: IssueSeverity | undefined;
            if (severity !== undefined && severity !== null && severity !== "") {
                if (typeof severity !== "string" || !SEVERITIES.includes(severity as IssueSeverity)) {
                    res.status(400).json({ message: "Invalid severity" });
                    return;
                }
                sev = severity as IssueSeverity;
            }

            const created = await issueModel.create({
                userId: req.user.userId,
                title: title.trim(),
                description: description,
                status: st,
                priority: pr,
                severity: sev,
            });
            const lean = await issueModel.findById(created._id).lean();
            res.status(201).json({ issue: toIssueDto(lean!) });
        } catch (error) {
            logger.error("Issue create error", error);
            next(error);
        }
    }

    export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                res.status(400).json({ message: "Invalid issue id" });
                return;
            }
            const body = req.body as Record<string, unknown>;
            const $set: Record<string, unknown> = {};
            const $unset: Record<string, string> = {};

            if (body.title !== undefined) {
                if (typeof body.title !== "string" || !body.title.trim()) {
                    res.status(400).json({ message: "Title cannot be empty" });
                    return;
                }
                $set.title = body.title.trim();
            }
            if (body.description !== undefined) {
                if (typeof body.description !== "string") {
                    res.status(400).json({ message: "Invalid description" });
                    return;
                }
                $set.description = body.description;
            }
            if (body.status !== undefined) {
                if (typeof body.status !== "string" || !STATUSES.includes(body.status as IssueStatus)) {
                    res.status(400).json({ message: "Invalid status" });
                    return;
                }
                $set.status = body.status;
            }
            if (body.priority !== undefined) {
                if (typeof body.priority !== "string" || !PRIORITIES.includes(body.priority as IssuePriority)) {
                    res.status(400).json({ message: "Invalid priority" });
                    return;
                }
                $set.priority = body.priority;
            }
            if (body.severity !== undefined) {
                if (body.severity === null || body.severity === "") {
                    $unset.severity = "";
                } else if (typeof body.severity === "string" && SEVERITIES.includes(body.severity as IssueSeverity)) {
                    $set.severity = body.severity;
                } else {
                    res.status(400).json({ message: "Invalid severity" });
                    return;
                }
            }

            if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
                res.status(400).json({ message: "No valid fields to update" });
                return;
            }

            const updateOp: mongoose.UpdateQuery<unknown> = {};
            if (Object.keys($set).length) updateOp.$set = $set;
            if (Object.keys($unset).length) updateOp.$unset = $unset;

            const updated = await issueModel
                .findOneAndUpdate({ _id: id, userId: req.user.userId }, updateOp, { new: true, runValidators: true })
                .lean();
            if (!updated) {
                res.status(404).json({ message: "Issue not found" });
                return;
            }
            res.status(200).json({ issue: toIssueDto(updated) });
        } catch (error) {
            logger.error("Issue update error", error);
            next(error);
        }
    }

    export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                res.status(400).json({ message: "Invalid issue id" });
                return;
            }
            const del = await issueModel.findOneAndDelete({ _id: id, userId: req.user.userId });
            if (!del) {
                res.status(404).json({ message: "Issue not found" });
                return;
            }
            res.status(200).json({ message: "Issue deleted" });
        } catch (error) {
            logger.error("Issue delete error", error);
            next(error);
        }
    }
}
