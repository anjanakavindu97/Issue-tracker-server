import { HydratedDocument, Model, Types } from "mongoose";

export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type IssuePriority = "low" | "medium" | "high" | "critical";
export type IssueSeverity = "minor" | "moderate" | "major" | "critical";

export interface Issue {
    userId: Types.ObjectId;
    title: string;
    description: string;
    status: IssueStatus;
    priority: IssuePriority;
    severity?: IssueSeverity;
}

export type IssueModelType = Model<Issue>;
export type IssueDocument = HydratedDocument<Issue>;
