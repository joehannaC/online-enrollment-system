import {
    Schema,
    model,
    models,
    type Model,
    type Types,
} from "mongoose";

export interface IEnrollment {
    studentId: Types.ObjectId;
    sectionId: Types.ObjectId;
    academicTermId: Types.ObjectId;

    status: "ENLISTED" | "ENROLLED" | "DROPPED" | "COMPLETED";

    enrolledAt?: Date;
    droppedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
    {
        studentId: {
        type: Schema.Types.ObjectId,
        required: true,
        },

        sectionId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Section",
        },

        academicTermId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "AcademicTerm",
        },

        status: {
        type: String,
        enum: ["ENLISTED", "ENROLLED", "DROPPED", "COMPLETED"],
        default: "ENROLLED",
        },

        enrolledAt: Date,
        droppedAt: Date,
    },
    {
        timestamps: true,
        collection: "enrollments",
    },
);

enrollmentSchema.index(
    {
        studentId: 1,
        sectionId: 1,
    },
    {
        unique: true,
    },
);

enrollmentSchema.index({
    studentId: 1,
    academicTermId: 1,
    status: 1,
});

export const Enrollment: Model<IEnrollment> = models.Enrollment || model<IEnrollment>("Enrollment", enrollmentSchema);