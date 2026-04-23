import { model, Schema } from "mongoose";
import { Issue, IssueModelType } from "../models/issue-model";

const issueSchema = new Schema<Issue>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 500 },
        description: { type: String, required: true, default: "", maxlength: 20000 },
        status: {
            type: String,
            required: true,
            enum: ["open", "in_progress", "resolved", "closed"],
            default: "open",
            index: true,
        },
        priority: {
            type: String,
            required: true,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
            index: true,
        },
        severity: {
            type: String,
            required: false,
            enum: ["minor", "moderate", "major", "critical"],
        },
    },
    { timestamps: true }
);

issueSchema.index({ userId: 1, createdAt: -1 });
issueSchema.index({ userId: 1, title: 1 });

export const issueModel = model<Issue, IssueModelType>("issue", issueSchema);
