import express from "express"
import mysql from "mysql"
import cors from "cors"
import jwt  from "jsonwebtoken"
import bcrypt from 'bcrypt'
import cookieParser from "cookie-parser"
const salt = 10;

const app = express()

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "penahuari"
})
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["POST","GET"],
    credentials: true
}))

const verifyUser = (req,res,next) =>{
    const token = req.cookies.token;
    if(!token){
        return res.json({Error: "No estas Autenticado"});
    }else{
        jwt.verify(token,"jwt-secret-key", (err,decoded) =>{
            if(err){
                return res.json({Error: "El token no es correcto"});
            }else{
                req.name = decoded.name;  
                next();
            }
        } )
    }
}

app.get('/',verifyUser,(req,res)=>{
    return res.json({Status: "Success",name: req.name});
})

app.get('/logout',(req,res) =>{
    res.clearCookie('token');
    return res.json({Status: "Success"});
})

app.post('/register',(req,res)=>{
    const q = "INSERT INTO cliente (nombre,correo_electronico,telefono,contrasena) VALUES (?)";
    bcrypt.hash(req.body.contrasena.toString(), salt,(err,hash)=>{
        if(err) return res.json({Error:"Error al hashear la contrasena"});
        const values = [
            req.body.name,
            req.body.correo,
            req.body.telefono,
            hash
        ]
        db.query(q, [values], (err,result)=>{
            if(err) return res.json({Error: "Error al insertar los datos"});
            return res.json({Status: "Success"})
        })
    })
})


app.post('/login',(req,res)=>{
    const q = "SELECT * FROM cliente WHERE correo_electronico = ?";
    db.query(q, [req.body.correo], (err,data)=>{
        if(err) return res.json({Error: "Error al logearse"});
        if(data.length > 0){
            bcrypt.compare(req.body.contrasena.toString(), data[0].contrasena, (err,response)=>{
                if(err) return res.json({Error: "Comparacion de contrasena erronea"})
                if(response){
                    const name = data[0].nombre;
                    const token = jwt.sign({name}, "jwt-secret-key",{expiresIn: '1d'});
                    res.cookie('token',token)
                    return res.json({Status: "Success"})
                }else{
                    return res.json({Error: "Contrasena incorrecta"})
                }
            })
        }else{
            return res.json({Error: "El correo no existe"})
        }
    })
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

