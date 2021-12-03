var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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

// src/networking/ghin-api.ts
var import_gaxios = __toModule(require("gaxios"));
var GHIN_URL = "https://api.ghin.com/api/v1";
var GHIN_EMAIL = "bcutler94@gmail.com";
var GHIN_PASSWORD = "Liverpool13";
import_gaxios.default.instance.defaults = {
  baseURL: GHIN_URL,
  retry: true,
  responseType: "json"
};
var login = async () => {
  try {
    const { data: { token } } = await import_gaxios.default.request({
      method: "POST",
      url: "/users/login.json",
      data: {
        user: {
          email: GHIN_EMAIL,
          password: GHIN_PASSWORD
        }
      }
    });
    return token;
  } catch (e) {
    logger.error(e);
    throw e;
  }
};
var getUser = async (ghin) => {
  try {
    const token = await login();
    const { data: { first_name, last_name, hi_value, club_name } } = await import_gaxios.default.request({
      method: "GET",
      url: `/golfers.json?global_search=true&search=${ghin}&per_page=1&page=1`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return {
      ghin,
      first_name,
      last_name,
      hi_value,
      club_name
    };
  } catch (e) {
    logger.error(e);
    throw e;
  }
};
var ghin_api_default = {
  getUser
};

// src/data-layer/database.ts
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

// src/models/user.ts
var createUser = async (user) => {
  const checkIfUserExists = await database_default.collection("users").findOne({ ghin: user.ghin });
  if (checkIfUserExists)
    throw new Error("User already exists!");
  await database_default.collection("users").insertOne(user);
  return user;
};
var user_default = {
  createUser
};

// src/route-handlers/user-hander.ts
var import_uuid = __toModule(require("uuid"));
var createUser2 = async (params) => {
  const { ghin, groupIds } = params;
  const { last_name: lastName, first_name: firstName, club_name: clubName, hi_value: currentHandicap } = await ghin_api_default.getUser(ghin);
  return await user_default.createUser({ userId: (0, import_uuid.v4)(), ghin, lastName, clubName, firstName, currentHandicap, groupIds });
};
var user_hander_default = {
  createUser: createUser2
};

// src/schemas/user-schema.ts
var import_typebox = __toModule(require("@sinclair/typebox"));
var successSchema = import_typebox.Type.Object({
  success: import_typebox.Type.Boolean({ value: true })
});
var errorSchema = import_typebox.Type.Object({
  success: import_typebox.Type.Boolean({ value: false }),
  errorMessage: import_typebox.Type.String()
});
var postUserBody = import_typebox.Type.Object({
  ghin: import_typebox.Type.String(),
  groupIds: import_typebox.Type.Array(import_typebox.Type.String())
});
var postUserReply = import_typebox.Type.Object({
  userId: import_typebox.Type.String(),
  ghin: import_typebox.Type.String(),
  groupIds: import_typebox.Type.Array(import_typebox.Type.String()),
  lastName: import_typebox.Type.String(),
  firstName: import_typebox.Type.String(),
  clubName: import_typebox.Type.String(),
  currentHandicap: import_typebox.Type.Number(),
  token: import_typebox.Type.String()
});
var res = import_typebox.Type.Union([
  import_typebox.Type.Intersect([
    postUserReply,
    successSchema
  ]),
  errorSchema
]);
var post = {
  body: postUserBody,
  response: {
    200: res
  }
};
var user_schema_default = {
  post
};

// src/index.ts
var import_fastify_jwt = __toModule(require("fastify-jwt"));

// src/route-handlers/middleware.ts
var verifyUser = async (req, rep, done) => {
  try {
    await req.jwtVerify();
    return done();
  } catch (err) {
    return rep.send(err);
  }
};
var middleware_default = {
  verifyUser
};

// src/index.ts
var server = (0, import_fastify.default)({ logger: { prettyPrint: true } });
server.register(import_fastify_jwt.default, { secret: "theMostSecretKeyOfAllFuckingTime" });
var logger = server.log;
server.get("/test", async (req, rep) => {
  rep.send("yo ben");
});
server.route({
  method: "POST",
  url: "/user",
  schema: user_schema_default.post,
  handler: async (req, rep) => {
    try {
      const { body } = req;
      const user = await user_hander_default.createUser(body);
      const token = server.jwt.sign({ userId: user.userId });
      rep.send(__spreadProps(__spreadValues({}, user), { success: true, token }));
    } catch (e) {
      rep.send({ success: false, errorMessage: e instanceof Error ? e.message : "An error occurred" });
    }
  }
});
server.route({
  method: "GET",
  url: "/user",
  preValidation: [middleware_default.verifyUser],
  handler: async (req, rep) => {
    try {
      logger.info(req.user.userId);
      rep.send({ yo: true });
    } catch (e) {
      rep.send({ success: false, errorMessage: e instanceof Error ? e.message : "An error occurred" });
    }
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
