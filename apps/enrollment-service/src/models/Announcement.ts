import {
    Schema,
    model,
    models,
    type Model,
    type Types,
} from "mongoose";

export interface IAnnouncement {
    title: string;
    message: string;

    audience: "ALL" | "STUDENT" | "FACULTY";

    publishedAt: Date;
    expiresAt?: Date;
    createdBy: Types.ObjectId;

    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";

    createdAt: Date;
    updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
    {
        title: {
        type: String,
        required: true,
        trim: true,
        },

        message: {
        type: String,
        required: true,
        trim: true,
        },

        audience: {
        type: String,
        enum: ["ALL", "STUDENT", "FACULTY"],
        default: "ALL",
        },

        publishedAt: {
        type: Date,
        required: true,
        },

        expiresAt: Date,

        createdBy: {
        type: Schema.Types.ObjectId,
        required: true,
        },

        status: {
        type: String,
        enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
        default: "DRAFT",
        },
    },
    {
        timestamps: true,
        collection: "announcements",
    },
);

announcementSchema.index({
    audience: 1,
    status: 1,
    publishedAt: -1,
});

export const Announcement: Model<IAnnouncement> = models.Announcement || model<IAnnouncement>("Announcement", announcementSchema);