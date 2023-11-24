const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require("jsonwebtoken"); 
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())




const uri = `mongodb+srv://${process.env.S3_BUCKET}:${process.env.SECRET_KEY}@cluster0.ycrlcva.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const usersCollection = client.db("EstateVistaDB").collection("users");
     

    app.post('/jwt',async(req,res)=>{
      const user =req.body;
      const token =jwt.sign(user,process.env.Access_Token,{
        expiresIn:'1h'
      });
      res.send({token})
    })
    //middlewares
    const verifyToken =(req,res,next)=>{
      console.log('insert verifyed token',req.headers)
      if(req.headers.authorization){
        return res.status(401).send({message:"forbidden access"});
        
      }
      next( )
    }
    app.get('/users',verifyToken,async(req,res)=>{
      console.log(req.headers)
      const result =await usersCollection.find().toArray();
      res.send(result)
    })
    app.post('/users', async(req,res)=>{
      const user =req.body;
      const query={email:user.email}
      const existingUser =await usersCollection.findOne(query)
      if(existingUser){
        return res.send({message:'user already exists', insertedId:null})

      }
      const result =await usersCollection.insertOne(user)
      res.send(result)
    })
    //user deleted
    app.delete('/users/:id',async (req,res)=>{
      const id =req.params.id
      const query ={_id: new ObjectId(id)}
      const result =await usersCollection.deleteOne(query)
      res.send(result)

    })
    //admin
    app.patch('/users/admin/:id',async(req,res)=>{
     const id =req.params.id;
     const filter ={_id : new ObjectId(id)}
     const updatedDoc ={
      $set:{
        role:"admin"
      }
    }
      const result =await usersCollection.updateOne(filter,updatedDoc)
      res.send(result)
     
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("Assignment 12 is running")
})
app.listen(port,()=>{
    console.log(`assignment is running on port ${port}`)
})