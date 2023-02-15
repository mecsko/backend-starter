import express, { Application, json, urlencoded } from "express";
import morgan from "morgan";
import type IController from "./interfaces/controller.interface";
// import cors from "cors";

export default class App {
    public app: Application;

    constructor(controllers: IController[]) {
        this.app = express();
        this.initMiddlewares();

        controllers.forEach(({ router }) => {
            this.app.use("/", router);
        });
    }

    private initMiddlewares() {
        // morgan logger middleware for node.js
        // settings: https://github.com/expressjs/morgan#predefined-formats
        this.app.use(
            morgan(":method :url status=:status :date[clf] length=:res[content-length] time=:response-time ms"),
        );
        this.app.use(json());
        this.app.use(urlencoded({ extended: false }));
        // Enabled CORS (don't forget to import cors):
        // this.app.use(cors());
    }

    public listen(): void {
        this.app.listen(5000, () => {
            console.log("App listening on the port 5000");
        });
    }
}
