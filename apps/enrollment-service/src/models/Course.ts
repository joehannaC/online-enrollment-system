import { Schema, model, models, type Model } from "mongoose";

export interface ICourse {
    courseCode: string;
    courseName: string;
    description?: string;
    units: number;
    department: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt: Date;
    updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
    {
        courseCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        },

        courseName: {
        type: String,
        required: true,
        trim: true,
        },

        description: {
        type: String,
        trim: true,
        },

        units: {
        type: Number,
        required: true,
        min: 0,
        },

        department: {
        type: String,
        required: true,
        },

        status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
        },
    },
    {
        timestamps: true,
        collection: "courses",
    },
);

courseSchema.index({ courseCode: 1 }, { unique: true });

export const Course: Model<ICourse> = models.Course || model<ICourse>("Course", courseSchema);