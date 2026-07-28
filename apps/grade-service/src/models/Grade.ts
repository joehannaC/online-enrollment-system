import {
    Schema,
    model,
    models,
    type Model,
    type Types,
} from "mongoose";

export interface IGrade {
    studentId: Types.ObjectId;
    sectionId: Types.ObjectId;
    academicTermId: Types.ObjectId;
    facultyId: Types.ObjectId;

    activitiesScore?: number;
    midtermScore?: number;
    finalScore?: number;

    computedScore?: number;

    finalGradeValue?: number;
    finalGradeCode?: "CR" | "INC" | "W";

    result:
        | "PASSED"
        | "FAILED"
        | "CREDITED"
        | "INCOMPLETE"
        | "PENDING";

    status: "DRAFT" | "SUBMITTED" | "VERIFIED" | "RETURNED";

    version: number;

    submittedAt?: Date;
    verifiedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const gradeSchema = new Schema<IGrade>(
    {
        studentId: {
        type: Schema.Types.ObjectId,
        required: true,
        },

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

        activitiesScore: {
        type: Number,
        min: 0,
        max: 30,
        },

        midtermScore: {
        type: Number,
        min: 0,
        max: 30,
        },

        finalScore: {
        type: Number,
        min: 0,
        max: 40,
        },

        computedScore: {
        type: Number,
        min: 0,
        max: 100,
        },

        finalGradeValue: {
        type: Number,
        },

        finalGradeCode: {
        type: String,
        enum: ["CR", "INC", "W"],
        },

        result: {
        type: String,
        enum: [
            "PASSED",
            "FAILED",
            "CREDITED",
            "INCOMPLETE",
            "PENDING",
        ],
        default: "PENDING",
        },

        status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "VERIFIED", "RETURNED"],
        default: "DRAFT",
        },

        version: {
        type: Number,
        default: 1,
        min: 1,
        },

        submittedAt: Date,
        verifiedAt: Date,
    },
    {
        timestamps: true,
        collection: "grades",
    },
);

gradeSchema.index(
    {
        studentId: 1,
        sectionId: 1,
    },
    {
        unique: true,
    },
);

gradeSchema.index({
    sectionId: 1,
    status: 1,
});

gradeSchema.index({
    studentId: 1,
    academicTermId: 1,
});

export const Grade: Model<IGrade> = models.Grade || model<IGrade>("Grade", gradeSchema);