var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/index.ts
__export(exports, {
  logger: () => logger
});
var import_fastify = __toModule(require("fastify"));

// src/route-handlers/user-hander.ts
var createUser = async (params) => {
  const { ghin, groupIds } = params;
};
var user_hander_default = {
  createUser
};

// src/schemas/user-schema.ts
var import_typebox = __toModule(require("@sinclair/typebox"));
var ErrorSchema = import_typebox.Type.Object({
  code: import_typebox.Type.String(),
  statusCode: import_typebox.Type.Optional(import_typebox.Type.Number()),
  message: import_typebox.Type.String()
});
var PostUserSchema = import_typebox.Type.Object({
  Body: import_typebox.Type.Object({
    ghin: import_typebox.Type.String(),
    groupIds: import_typebox.Type.Array(import_typebox.Type.String())
  }),
  Reply: import_typebox.Type.Union([
    import_typebox.Type.Object({
      success: import_typebox.Type.Boolean()
    }),
    ErrorSchema
  ])
});
var userPost = {
  schema: {
    body: PostUserSchema,
    response: {
      200: PostUserSchema
    }
  }
};
var user_schema_default = {
  userPost
};

// src/mongo/database.ts
var import_mongodb = __toModule(require("mongodb"));
var uri = "mongodb://127.0.0.1:27017";
var client = new import_mongodb.MongoClient(uri);
async function run() {
  try {
    await client.connect();
    logger.info("connected to db");
  } catch (e) {
    logger.error("failed to connect to db", e);
    await client.close();
  }
}
run().catch(console.dir);
var database_default = client.db("golf");

// src/index.ts
var server = (0, import_fastify.default)({ logger: { prettyPrint: true } });
var logger = server.log;
server.get("/test", async (req, rep) => {
  rep.send("yo ben");
});
server.post("/user", user_schema_default.userPost, async (req, rep) => {
  try {
    const { body } = req;
    await user_hander_default.createUser(body);
    rep.send({ success: true });
  } catch (e) {
    rep.send(e);
  }
});
server.listen(8080, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  logger
});
