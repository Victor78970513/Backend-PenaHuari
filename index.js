import express from "express"
import mysql from "mysql"
import cors from "cors"

const app = express()

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "penahuari"
})

app.use(express.json())
app.use(cors())

app.get("/", (req, res)=>{
    res.json("hello from de backend")
})

app.get("/platos",(req,res)=>{
    const q = "SELECT * FROM comida"
    db.query(q,(err,data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get("/breakfast", (req,res)=>{
    const q = "SELECT * FROM comida WHERE comida.id_seccion = 1"
    db.query(q,(err,data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get("/lunch", (req,res)=>{
    const q = "SELECT * FROM comida WHERE comida.id_seccion = 2"
    db.query(q,(err,data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get("/dinner",(req,res)=>{
    const q = "SELECT * FROM comida WHERE comida.id_seccion = 3"
    db.query(q,(err,data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get("/drink",(req,res)=>{
    const q = "SELECT * FROM comida WHERE comida.id_seccion = 4"
    db.query(q,(err,data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get("/dessert",(req,res)=>{
    const q = "SELECT * FROM comida WHERE comida.id_seccion = 5"
    db.query(q,(err,data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})


app.get("/shows",(req,res)=>{
    const q = "SELECT * FROM funcion"
    db.query(q,(err,data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})
app.listen(3000,()=>{
    console.log('conectado con el backend')
})

