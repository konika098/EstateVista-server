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
    const propertiesCollection = client.db("EstateVistaDB").collection("properties");
    const advertisementCollection = client.db("EstateVistaDB").collection("ad");
    const serviceCollection = client.db("EstateVistaDB").collection("services");
    const wishCollection = client.db("EstateVistaDB").collection("wishList");
    const offerCollection = client.db("EstateVistaDB").collection("offer");
     

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
      if(!req.headers.authorization){
        return res.status(403).send({message:"unauthorized  access"});

      }
      const token =req.headers.authorization.split(' ')[1];
       jwt.verify(token,process.env.Access_Token,(err,decoded)=>{
        if(err){
          return res.status(401).send({message:"unauthorized access"});
        }
        req.decoded =decoded
        next()
       })
      
    }

    const verifyAdmin=async(req,res,next)=>{
      const email =req.decoded.email;
      const query={
       email:email
      }
      const user= await usersCollection.findOne(query)
      const isAdmin = user?.role==='admin';
      if(!isAdmin){
        return res.status(403).send({message:"forbidden access"})
      }
      next()
    } 
    const verifyAgent=async(req,res,next)=>{
      const email =req.decoded.email;
      const query={
       email:email
      }
      const user= await usersCollection.findOne(query)
      const isAgent = user?.role==='agent';
      if(!isAgent){
        return res.status(403).send({message:"forbidden access"})
      }
      next()
    } 
    app.get('/user',verifyToken,verifyAdmin,async(req,res)=>{
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

    //admin
    app.patch('/users/admin/:id',verifyToken,verifyAdmin,async(req,res)=>{
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
    
    app.get('/user/admin/:email',verifyToken,async(req,res)=>{
      const email =req.params.email
      if(email !== req.decoded.email){
        return res.status(403).send({message:"forbidden access"})

      }
      const query={email:email}
      const user=await usersCollection.findOne(query)
      let admin =false
      if(user){
        admin =user?.role==='admin'
      }
      res.send({admin})
      
    })
    app.get('/newAdvertisement', async (req, res) => {
      const cursor =await advertisementCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    //agent
    app.patch('/users/agent/:id',verifyToken, verifyAdmin,async(req,res)=>{
      const id =req.params.id;
      const filter ={_id : new ObjectId(id)}
      const updatedDoc ={
       $set:{
         role:"agent"
       }
     }
       const result =await usersCollection.updateOne(filter,updatedDoc)
       res.send(result)
      
     })
      
    app.get('/user/agent/:email',verifyToken,async(req,res)=>{
      const email =req.params.email
      if(email !== req.decoded.email){
        return res.status(403).send({message:"forbidden access"})

      }
      const query={email:email}
      const user=await usersCollection.findOne(query)
      let agent =false
      if(user){
       agent =user?.role==='agent'
      }
      res.send({agent})
      
    })
    app.post('/NewProperties', async (req, res) => {
      const NewProperties = req.body

      const result = await propertiesCollection.insertOne(NewProperties)
      res.send(result)
    })
    
    app.get('/NewPostProperties', async (req, res) => {
      const cursor =await propertiesCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
   
    app.get('/services', async (req, res) => {
      const cursor =await serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    app.get('/newAdvertisement', async (req, res) => {
      const cursor =await advertisementCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    app.get('/details/:id', async (req, res) => {
      const cursor =await advertisementCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    app.get('/AllProperties/:id', async (req, res) => {
      const id =req.params.id
      console.log();
      const query ={_id: new ObjectId(id)}
      const result =await propertiesCollection.findOne(query)
      res.send(result)
    })
   
    app.get('/AllProperties', async (req, res) => {
      const cursor =await propertiesCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
   
    app.post('/newAdvertisement', async (req, res) => {
      const newAdvertisement = req.body

      const result = await advertisementCollection.insertOne(newAdvertisement)
      res.send(result)
    })

    app.put('/Verify/:id', async(req,res)=>{
      const id =req.params.id;
      const query ={_id: new ObjectId(id)}
      const updateStatus ={$set:{
        verificationStatus:"verify"
      }}
      const result =await propertiesCollection.updateOne(query ,updateStatus)
      res.send(result)
    })
    app.put('/Reject/:id', async(req,res)=>{
      const id =req.params.id;
      const query ={_id: new ObjectId(id)}
      const updateStatus ={$set:{
        verificationStatus:"reject"
      }}
      const result =await propertiesCollection.updateOne(query ,updateStatus)
      res.send(result)
    })
    //user
    //wishList
    app.post('/wishlist',async(req,res)=>{
      const wishListItem =req.body;
      const result =await wishCollection.insertOne(wishListItem)
      res.send(result)
    })
  
    app.get('/wishlist', async (req, res) => {
      const cursor =await wishCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/wishList/:id', async (req, res) => {
      const id =req.params.id
      console.log();
      const query ={_id: new ObjectId(id)}
      const result =await wishCollection.findOne(query)
      res.send(result)
    })
    app.get('/offerDetails', async (req, res) => {
      const cursor =await offerCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
    app.post('/offerDetails',async(req,res)=>{
      const offerDetails =req.body;
      const result =await offerCollection.insertOne(offerDetails)
      res.send(result)
    })


        //user deleted
        app.delete('/users/:id',async (req,res)=>{
          const id =req.params.id
          const query ={_id: new ObjectId(id)}
          const result =await usersCollection.deleteOne(query)
          res.send(result)
    
        })
        app.delete('/wishes/:id',async (req,res)=>{
          const id =req.params.id
          console.log({id});
          const query ={_id: new ObjectId(id)}
          const result =await wishCollection.deleteOne(query)
          res.send(result)
    
        })
        app.put('/Accept/:id', async(req,res)=>{
          const id =req.params.id;
          const query ={_id: new ObjectId(id)}
          const updateStatus ={$set:{
            verificationStatus:"Accepted"
          }}
          const result =await offerCollection.updateOne(query ,updateStatus)
          res.send(result)
        })
        app.put('/reject/:id', async(req,res)=>{
          const id =req.params.id;
          const query ={_id: new ObjectId(id)}
          const updateStatus ={$set:{
            verificationStatus:"Rejected"
          }}
          const result =await offerCollection.updateOne(query ,updateStatus)
          res.send(result)
        })
   

    // app.get('/user/buyer/:email',verifyToken,async(req,res)=>{
    //   const email =req.params.email
    //   if(email !== req.decoded.email){
    //     return res.status(403).send({message:"forbidden access"})

    //   }
    //   const query={email:email}
    //   const user=await usersCollection.findOne(query)
    //   let buyer =false
    //   if(user){
    //    buyer =user?.role==='user'
    //   }
    //   res.send({buyer})
      
    // })





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