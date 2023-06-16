import express from "express";
import mysql from "mysql";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
const salt = 10;

const app = express();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "penahuari",
});
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["POST", "GET"],
    credentials: true,
  })
);

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "No estas Autenticado" });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) {
        return res.json({ Error: "El token no es correcto" });
      } else {
        req.correo_electronico = decoded.correo_electronico;
        req.id_cliente = decoded.id_cliente;
        req.name = decoded.name;
        next();
      }
    });
  }
};

app.get('/platopornombre',(req,res)=>{
  const {nombre} = req.query;
  const q = "SELECT * FROM plato WHERE nombre LIKE (?)";
  db.query(q,[`%${nombre}%`],(err,result)=>{
    if(err){
      return res.json({Error: "Error al buscar por platos"})
    }
    return res.json({platos:result});
  });
});

app.get('/presupuesto',(req,res)=>{
  const {presupuesto} = req.query;
  const q = 'SELECT * FROM plato WHERE plato.precio < (?)';
  db.query(q, [presupuesto],(err,result)=>{
    if(err){
      return res.json({Error: "Error al buscar los platos"})
    }
    return res.json({platos:result});
  });
});

app.post("/reservamesa", verifyUser, (req, res) => {
  const idCliente = req.id_cliente;
  const q = "INSERT INTO reserva (id_cliente) VALUES (?)";
  const values = [idCliente];
  let successCount = 0; // Variable para contar las inserciones exitosas
  
  db.query(q, [values], (err, result) => {
    if (err) {
      return res.json({ Error: "Error al insertar en la tabla reserva" });
    }
    
    const idReserva = result.insertId;
    const q2 = "INSERT INTO mesa_reserva (id_reserva, id_mesa) VALUES (?)";
    const mesaIds = req.body.mesas.map((mesa) => mesa.id_mesa);
    
    req.body.mesas.forEach((mesa) => {
      const mesaValues = [idReserva, mesa.id_mesa];
      
      db.query(q2, [mesaValues], (err, result) => {
        if (err) {
          return res.json({ Error: "Error al insertar a la tabla reserva_mesa" });
        }
        
        successCount++; // Incrementar el contador de inserciones exitosas
        
        if (successCount === req.body.mesas.length) {
          const q3 = "UPDATE mesa SET estado = 'ocupado' WHERE id_mesa IN (?)";
          
          db.query(q3, [mesaIds], (err, result) => {
            if (err) {
              return res.json({ Error: "Error al actualizar el estado de las mesas" });
            }
            
            return res.json({ Status: "Success" });
          });
        }
      });
    });
  });
});
app.get("/platos/:id_ingrediente", (req, res) => {
  const idIngrediente = req.params.id_ingrediente;
  
  const query = `
    SELECT plato.*
    FROM plato
    JOIN ingrediente_plato ON plato.id_comida = ingrediente_plato.id_comida
    WHERE ingrediente_plato.id_ingrediente = ?;
  `;
  
  db.query(query, [idIngrediente], (err, result) => {
    if (err) {
      return res.json({ Error: "Error al buscar platos por ingrediente" });
    }
    
    const platos = result;
    return res.json({ Platos: platos });
  });
});
app.post("/pedido", verifyUser, (req, res) => {
  const idCliente = req.id_cliente;
  console.log(idCliente);
  const q = "INSERT INTO pedido (id_cliente,precio_total,fecha) VALUES (?)";
  const values = [idCliente, req.body.precio_total, req.body.fecha];
  db.query(q, [values], (err, result) => {
    if (err) {
      return res.json({ Error: "Error al insertar en la tabla pedido" });
    }
    const idPedido = result.insertId;
    const q2 =
      "INSERT INTO pedido_plato (id_pedido, id_comida, cantidad_platos) VALUES (?, ?, ?)";
      let successCount = 0;
    req.body.platos.forEach((pedidoPlato) => {
      const platoValues = [
        idPedido,
        pedidoPlato.id_comida,
        pedidoPlato.cantidad_platos,
      ];
      db.query(q2, platoValues, (err, result) => {
        if (err) {
          return res.json({Error: "Error al insertar en la tabla pedido_plato"});
        }
        console.log("Fila insertada en la tabla pedido_plato");
        successCount++;
        if(successCount === req.body.platos.length){
            return res.json({Status: "Success"});
        }
      });
    });
  });
});
app.get("/", verifyUser, (req, res) => {
  return res.json({
    Status: "Success",
    name: req.name,
    id_cliente: req.id_cliente,
    correo_electronico: req.correo_electronico
  });
});
app.post("/tarjeta", verifyUser,(req,res)=>{
  const idCliente = req.id_cliente
  const values = [idCliente, req.body.cardholderName, req.body.cardNumber, req.body.expireDate, req.body.cvv];
  const q = "INSERT INTO tarjeta (id_cliente, numero_tarjeta, nombre_tarjeta, fecha_vencimiento, cvv) VALUES (?)"
  db.query(q,[values],(err,result)=>{
    if(err){
      return res.json({ Error: "Error al insertar la tarjeta" });
    }
    return res.json({Status:"Success"});
  })
})


app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: "Success" });
});
app.post("/updatepassword", verifyUser, (req, res) => {
  const newPassword = req.body.newPassword;
  const userId = req.id_cliente;

  bcrypt.hash(newPassword.toString(), salt, (err, hash) => {
    if (err) return res.json({ Error: "Error al hashear la contrasena" });

    const q = "UPDATE cliente SET contrasena = ? WHERE id_cliente = ?";
    db.query(q, [hash, userId], (err, result) => {
      if (err) return res.json({ Error: "Error al actualizar la contrasena" });

      return res.json({ Status: "Success" });
    });
  });
});

app.post("/updateaccount", verifyUser, (req, res) => {
  const { name, correo } = req.body;
  const id_cliente = req.id_cliente;

  const q = "UPDATE cliente SET nombre = ?, correo_electronico = ? WHERE id_cliente = ?";
  db.query(q, [name, correo, id_cliente], (err, result) => {
    if (err) {
      return res.json({ Error: "Error al actualizar la cuenta del cliente" });
    }
    return res.json({ Status: "Success" });
  });
});

app.post("/register", (req, res) => {
  const q =
    "INSERT INTO cliente (nombre,correo_electronico,telefono,contrasena) VALUES (?)";
  bcrypt.hash(req.body.contrasena.toString(), salt, (err, hash) => {
    if (err) return res.json({ Error: "Error al hashear la contrasena" });
    const values = [req.body.name, req.body.correo, req.body.telefono, hash];
    db.query(q, [values], (err, result) => {
      if (err) return res.json({ Error: "Error al insertar los datos" });
      return res.json({ Status: "Success" });
    });
  });
});

app.post("/login", (req, res) => {
  const q = "SELECT * FROM cliente WHERE correo_electronico = ?";
  db.query(q, [req.body.correo], (err, data) => {
    if (err) return res.json({ Error: "Error al logearse" });
    if (data.length > 0) {
      bcrypt.compare(
        req.body.contrasena.toString(),
        data[0].contrasena,
        (err, response) => {
          if (err)
            return res.json({ Error: "Comparacion de contrasena erronea" });
          if (response) {
            const correo_electronico = data[0].correo_electronico;
            const id_cliente = data[0].id_cliente;
            const name = data[0].nombre;
            const token = jwt.sign({ id_cliente, name,correo_electronico}, "jwt-secret-key", {
              expiresIn: "1d",
            });
            res.cookie("token", token);
            return res.json({ Status: "Success" });
          } else {
            return res.json({ Error: "Contrasena incorrecta" });
          }
        }
      );
    } else {
      return res.json({ Error: "El correo no existe" });
    }
  });
});

app.get("/platos", (req, res) => {
  const q = "SELECT * FROM plato";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/breakfast", (req, res) => {
  const q = "SELECT * FROM plato WHERE plato.id_seccion = 1";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/lunch", (req, res) => {
  const q = "SELECT * FROM plato WHERE plato.id_seccion = 2";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/dinner", (req, res) => {
  const q = "SELECT * FROM plato WHERE plato.id_seccion = 3";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/drink", (req, res) => {
  const q = "SELECT * FROM plato WHERE plato.id_seccion = 4";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/dessert", (req, res) => {
  const q = "SELECT * FROM plato WHERE plato.id_seccion = 5";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/shows", (req, res) => {
  const q = "SELECT * FROM funcion";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});
app.get("/mesas",(req,res)=>{
  const q = "SELECT * FROM mesa";
  db.query(q, (err,data) => {
    if(err) return res.json(err);
    return res.json(data);
  });
});
app.listen(3000, () => {
  console.log("conectado con el backend");
});
