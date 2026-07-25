const replicaSetName = "enrollment-rs";

const config = {
    _id: replicaSetName,
    members: [
        {
        _id: 0,
        host: "mongo1:27117",
        priority: 2
        },
        {
        _id: 1,
        host: "mongo2:27118",
        priority: 1
        },
        {
        _id: 2,
        host: "mongo3:27119",
        priority: 1
        }
    ]
};

try {
    const currentConfig = rs.conf();

    if (currentConfig._id === replicaSetName) {
        print("Replica set is already configured.");
    }
    } catch (error) {
    print("Initializing MongoDB replica set...");
    rs.initiate(config);
}