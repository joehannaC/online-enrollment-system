import {
    Schema,
    model,
    models,
    type Model,
    type Types,
} from "mongoose";

export interface ISectionSchedule {
    days: string[];
    startTime: string;
    endTime: string;
    room: string;
}

export interface ISection {
    courseId: Types.ObjectId;
    academicTermId: Types.ObjectId;
    facultyId: Types.ObjectId;

    sectionCode: string;
    schedule: ISectionSchedule[];

    capacity: number;
    enrolledCount: number;

    status: "OPEN" | "CLOSED" | "CANCELLED";

    createdAt: Date;
    updatedAt: Date;
}

const scheduleSchema = new Schema<ISectionSchedule>(
    {
        days: {
        type: [String],
        required: true,
        },

        startTime: {
        type: String,
        required: true,
        },

        endTime: {
        type: String,
        required: true,
        },

        room: {
        type: String,
        required: true,
        },
    },
    {
        _id: false,
    },
);

const sectionSchema = new Schema<ISection>(
    {
        courseId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Course",
        },

        academicTermId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "AcademicTerm",
        },

        facultyId: {
        type: Schema.Types.ObjectId,
        required: true,
        },

        sectionCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        },

        schedule: {
        type: [scheduleSchema],
        required: true,
        },

        capacity: {
        type: Number,
        required: true,
        min: 1,
        },

        enrolledCount: {
        type: Number,
        default: 0,
        min: 0,
        },

        status: {
        type: String,
        enum: ["OPEN", "CLOSED", "CANCELLED"],
        default: "OPEN",
        },
    },
    {
        timestamps: true,
        collection: "sections",
    },
);

sectionSchema.index(
    {
        courseId: 1,
        sectionCode: 1,
        academicTermId: 1,
    },
    {
        unique: true,
    },
);

sectionSchema.index({ facultyId: 1, academicTermId: 1 });
sectionSchema.index({ academicTermId: 1, status: 1 });

export const Section: Model<ISection> = models.Section || model<ISection>("Section", sectionSchema);