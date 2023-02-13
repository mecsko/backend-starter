import { set, connect, connection } from "mongoose";
import nsideModel from "../controllers/nside.model";
import onesideModel from "../controllers/oneside.model";

async function connectToTheDatabase() {
    try {
        const uri = "mongodb://127.0.0.1:27017/AdatbázisNeve";
        set("strictQuery", true); // for disable Deprecation Warning
        // Connect to localhost:27017, create "AdatbázisNeve" database if not exist:
        await connect(uri);
        console.log(`Connected to ${uri}`);

        // init models for populate
        onesideModel.init();
        nsideModel.init();

        connection.on("error", error => {
            console.log(`Mongoose error message: ${error.message}`);
        });
    } catch (error) {
        console.log("Unable to connect to the server. Please start MongoDB.");
    }
}

export { connectToTheDatabase };
