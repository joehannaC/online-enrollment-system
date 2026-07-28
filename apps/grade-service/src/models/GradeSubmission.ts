import {
    Schema,
    model,
    models,
    type Model,
    type Types,
} from "mongoose";

export interface IGradeSubmission {
    sectionId: Types.ObjectId;
    academicTermId: Types.ObjectId;
    facultyId: Types.ObjectId;

    gradeType: "MIDTERM" | "FINAL" | "PROGRESS";

    totalStudents: number;
    completedCount: number;

    status: "DRAFT" | "SUBMITTED" | "VERIFIED" | "RETURNED";

    submittedAt?: Date;
    verifiedAt?: Date;
    returnedAt?: Date;
    returnReason?: string;

    createdAt: Date;
    updatedAt: Date;
}

const gradeSubmissionSchema = new Schema<IGradeSubmission>(
    {
        sectionId: {
        type: Schema.Types.ObjectId,
        required: true,
        },

        academicTermId: {
        type: Schema.Types.ObjectId,
        required: true,
        },

        facultyId: {
        type: Schema.Types.ObjectId,
        required: true,
        },

        gradeType: {
        type: String,
        enum: ["MIDTERM", "FINAL", "PROGRESS"],
        required: true,
        },

        totalStudents: {
        type: Number,
        required: true,
        min: 0,
        },

        completedCount: {
        type: Number,
        default: 0,
        min: 0,
        },

        status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "VERIFIED", "RETURNED"],
        default: "DRAFT",
        },

        submittedAt: Date,
        verifiedAt: Date,
        returnedAt: Date,

        returnReason: {
        type: String,
        trim: true,
        },
    },
    {
        timestamps: true,
        collection: "gradeSubmissions",
    },
);

gradeSubmissionSchema.index(
    {
        sectionId: 1,
        gradeType: 1,
    },
    {
        unique: true,
    },
);

gradeSubmissionSchema.index({
    facultyId: 1,
    academicTermId: 1,
    status: 1,
});

export const GradeSubmission: Model<IGradeSubmission> = models.GradeSubmission || model<IGradeSubmission>("GradeSubmission",gradeSubmissionSchema,);