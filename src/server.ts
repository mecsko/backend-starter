import App from "./app";
import { connectToTheDatabase } from "./db/connectToDb";
// remove onesideController or nsideController, if you don't use it:
import nsideController from "./controllers/nside.controller";
import onesideController from "./controllers/oneside.controller";

(async () => {
    await connectToTheDatabase();
    const app = new App([new nsideController(), new onesideController()]);
    app.listen();
})();
