const replicaSetName = "enrollment-rs";

const config = {
    _id: replicaSetName,
    members: [
        {
            _id: 0,
            host: "mongo1:27117",
            priority: 2,
        },
        {
            _id: 1,
            host: "mongo2:27118",
            priority: 1,
        },
        {
            _id: 2,
            host: "mongo3:27119",
            priority: 1,
        },
    ],
};

try {
    const currentConfig = rs.conf();

    if (currentConfig._id === replicaSetName) {
        print("Replica set is already configured.");
        printjson(currentConfig);
    } else {
        throw new Error(
            `Unexpected replica set name: ${currentConfig._id}`,
        );
    }
} catch (error) {
    if (
        error.code === 94 ||
        error.codeName === "NotYetInitialized" ||
        String(error.message).includes(
            "no replset config has been received",
        )
    ) {
        print("Initializing MongoDB replica set...");

        const result = rs.initiate(config);
        printjson(result);
    } else {
        print("Replica set initialization failed:");
        printjson(error);
        throw error;
    }
}