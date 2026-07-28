import {
    Schema,
    model,
    models,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose";

export interface IFaculty {
    userId: Types.ObjectId;
    employeeNumber: string;

    title?: string;
    firstName: string;
    middleName?: string;
    lastName: string;

    department: string;
    college: string;

    status: "ACTIVE" | "INACTIVE";

    createdAt: Date;
    updatedAt: Date;
}

export type FacultyDocument = HydratedDocument<IFaculty>;

const facultySchema = new Schema<IFaculty>(
    {
        userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
        },

        employeeNumber: {
        type: String,
        required: true,
        trim: true,
        },

        title: {
        type: String,
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

        department: {
        type: String,
        required: true,
        },

        college: {
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
        collection: "faculty",
    },
);

facultySchema.index({ userId: 1 }, { unique: true });
facultySchema.index({ employeeNumber: 1 }, { unique: true });

export const Faculty: Model<IFaculty> = models.Faculty || model<IFaculty>("Faculty", facultySchema);