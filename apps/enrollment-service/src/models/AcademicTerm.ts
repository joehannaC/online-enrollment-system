import { Schema, model, models, type Model } from "mongoose";

export interface IAcademicTerm {
    code: string;
    name: string;
    academicYear: string;
    termNumber: number;

    startDate: Date;
    endDate: Date;

    enrollmentStart: Date;
    enrollmentEnd: Date;

    gradeSubmissionDeadline?: Date;

    status: "UPCOMING" | "ACTIVE" | "COMPLETED";
    isCurrent: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const academicTermSchema = new Schema<IAcademicTerm>(
    {
        code: {
        type: String,
        required: true,
        trim: true,
        },

        name: {
        type: String,
        required: true,
        },

        academicYear: {
        type: String,
        required: true,
        },

        termNumber: {
        type: Number,
        required: true,
        min: 1,
        },

        startDate: {
        type: Date,
        required: true,
        },

        endDate: {
        type: Date,
        required: true,
        },

        enrollmentStart: {
        type: Date,
        required: true,
        },

        enrollmentEnd: {
        type: Date,
        required: true,
        },

        gradeSubmissionDeadline: Date,

        status: {
        type: String,
        enum: ["UPCOMING", "ACTIVE", "COMPLETED"],
        required: true,
        },

        isCurrent: {
        type: Boolean,
        default: false,
        },
    },
    {
        timestamps: true,
        collection: "academicTerms",
    },
);

academicTermSchema.index({ code: 1 }, { unique: true });
academicTermSchema.index({ isCurrent: 1 });

export const AcademicTerm: Model<IAcademicTerm> = models.AcademicTerm || model<IAcademicTerm>("AcademicTerm", academicTermSchema);