import mongoose, {
    Schema,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose";

export interface IStudent {
    userId: Types.ObjectId;
    studentNumber: string;

    firstName: string;
    middleName?: string;
    lastName: string;

    programCode: string;
    programName: string;
    curriculumCode: string;

    college: string;
    campus: string;
    yearLevel: number;
    requiredUnits: number;

    status: "ACTIVE" | "INACTIVE" | "GRADUATED";

    createdAt: Date;
    updatedAt: Date;
}

export type StudentDocument = HydratedDocument<IStudent>;

const studentSchema = new Schema<IStudent>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },

        studentNumber: {
            type: String,
            required: true,
            trim: true,
        },

        firstName: {
            type: String,
            required: true,
            trim: true,
        },

        middleName: {
            type: String,
            trim: true,
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
        },

        programCode: {
            type: String,
            required: true,
            trim: true,
        },

        programName: {
            type: String,
            required: true,
            trim: true,
        },

        curriculumCode: {
            type: String,
            required: true,
            trim: true,
        },

        college: {
            type: String,
            required: true,
            trim: true,
        },

        campus: {
            type: String,
            required: true,
            trim: true,
        },

        yearLevel: {
            type: Number,
            required: true,
            min: 1,
        },

        requiredUnits: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "GRADUATED"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
        collection: "students",
    },
);

studentSchema.index({ userId: 1 }, { unique: true });
studentSchema.index({ studentNumber: 1 }, { unique: true });

export const Student: Model<IStudent> =
    (mongoose.models.Student as Model<IStudent> | undefined) ??
    mongoose.model<IStudent>("Student", studentSchema);