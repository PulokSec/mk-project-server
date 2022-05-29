const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config();

const cors = require("cors");

app.use(cors());
app.use(express.json());

const uri =
	`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uth2f.mongodb.net/projectManager?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

async function run() {
	try {
		await client.connect();
		console.log("Connected to Database!");
		const database = client.db("projectManager");
		const userCollection = database.collection("users");
		const projectCollection = database.collection("projects");

		//*POST project
		app.post("/project", async (req, res) => {
			const project = req.body;
			const result = await projectCollection.insertOne(project);
			res.send(result);
		});
		//*GET All projects
		app.get("/projects", async (req, res) => {
			const projects = await projectCollection.find().toArray();
			res.send(projects);
		});


		//Get users running projects by email
		app.post("/user/byemail", async (req, res) => {
			const data = req.body;
			console.log(data.email);
			const query = { joined : {$elemMatch:{email: data.email}}, status: data.status};			
			const projects = await projectCollection.find(query).toArray();
			res.send(projects);
		});


		//*GET Admin projects
		app.post("/admin/byemail", async (req, res) => {
			const data = req.body;
			const query = { email: data.email, status: data.status };
			const projects = await projectCollection.find(query).toArray();
			res.send(projects);
		});

		//*POST A new user in user collection
		app.post("/users", async (req, res) => {
			const user = req.body;
			const result = await userCollection.insertOne(user);
			res.json(result);
		});

		//*Get projects in project collection
		app.get("/projects", async (req, res) => {
			const cursor = projectCollection.find({});
			const projects = await cursor.toArray();
			res.json(projects);
		});
		//Get Joined Projects
		app.post("/existing/byemail", async (req, res) => {
			const data = req.body;
			const query = { email: data.email };
			const user = await userCollection.find(query).toArray();
			res.send(user[0]);;
		});

		//*Put Google Login user in user collection
		app.put("/users", async (req, res) => {
			const user = req.body;
			const filter = { email: user.email };
			const options = { upsert: true };
			const updateDoc = { $set: user };
			const result = await userCollection.updateOne(filter, updateDoc, options);
			res.json(result);
		});

		//*UPDATE Join Status
		app.put('/join/:id',async (req,res)=>{
			const id = req.params.id;
			const data = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$push: {
					joined: {email: data.email, name: data.name}
				}
			};
			await projectCollection.updateOne(filter, updateDoc, options);
			const updateStatus = {
				$push: {
					appliedProject:id
				}
			}
					const result = await userCollection.updateOne({email: data.email},
						updateStatus, options)
						res.json(result)
				})
				//Start Project
				app.put("/start/:id", async (req, res) => {
					const id = req.params.id;
					const status = req.body;
					const filter = { _id: ObjectId(id) };
					const options = { upsert: true };
					const updateDoc = {
						$set: {
							status: status.status,
						},
					};
					const result = await projectCollection.updateOne(filter, updateDoc, options);
					res.json(result);
				});

				//Finish project
		app.put("/finish/:id", async (req, res) => {
			const id = req.params.id;
			const status = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					status: status.status,
				},
			};
			const result = await projectCollection.updateOne(filter, updateDoc, options);
			res.json(result);
		});

		//* Check Admin
		app.get("/users/:email", async (req, res) => {
			const email = req.params.email;

			const query = { email: email };
			const user = await userCollection.findOne(query);
			let isAdmin = false;
			if (user?.role === "admin") {
				isAdmin = true;
			}
			res.json({ admin: isAdmin });
		});
		//*DELETE Single Data
		app.delete("/project/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await projectCollection.deleteOne(query);
			res.json(result);
		});
	} finally {
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Running MK-projects-management Server");
});

app.listen(port, () => {
	console.log("Running MK-projects-management Server on port", port);
});
