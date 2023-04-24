const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize({
  storage: "db_alumnos.db",
  dialect: "sqlite",
  define: {
    defaultScope: {
      attributes: { exclude: ["createdAt", "updatedAt"] },
    },
  },
});

const Alumno = sequelize.define("alumnos", {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'El campo "nombre" no puede ser nulo',
      },
      notEmpty: {
        msg: 'El campo "nombre" no puede estar vacío',
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: true,
    validate: {
      isEmail: true, 
    },
  },
   fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: true,
    validate: {
      notNull: {
        msg: 'El campo "fecha_nacimiento" no puede ser nulo',
      },
      notEmpty: {
        msg: 'El campo "fecha_nacimiento" no puede estar vacío',
      },
    },
  }
});

const Cursada = sequelize.define("cursadas", {
  materia: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'El campo "materia" no puede ser nulo',
      },
      notEmpty: {
        msg: 'El campo "materia" no puede estar vacío',
      },
    },
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'El campo "anio" no puede ser nulo',
      },
      notEmpty: {
        msg: 'El campo "anio" no puede estar vacío',
      },
      max: 2100,
      min: 1,
    },
  },
  cuatrimestre: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'El campo "cuatrimestre" no puede ser nulo',
      },
      notEmpty: {
        msg: 'El campo "cuatrimestre" no puede estar vacío',
      },
      max: 2,
      min: 1,
    },
  },
  aprobada: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    validate: {
      isIn: {
        args: [[0, 1, false, true]],
        msg: 'El campo "aprobada" debe ser una de las siguientes opciones: 1 / true (=verdadero) ó 0 / false (=falso)',
      },
    },
  }
});

Alumno.hasMany(Cursada, { as: "cursadas" });

app.use(bodyParser.json());

sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      popular();
      console.log("El servidor está corriendo en el puerto " + port);
    });
  })
  .catch((error) => {
    console.error("Error al sincronizar la base de datos:", error);
  });

app.get("/Alumnos", async (req, res) => {
  const data = await Alumno.findAll();
  res.json(data);
});

app.get("/Alumnos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const unAlumno = await Alumno.findByPk(id, {
      include: "cursadas",
    });
    if (unAlumno === null) {
      res.status(404).json({ error: `No se encontró al Alumno con ID ${id}.` });
    } else {
      res.json(unAlumno);
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ha ocurrido un error al ejecutar la consulta." });
  }
});



app.post("/Alumnos/", async (req, res) => {
  try {
    const unAlumno = await Alumno.build(req.body);
    await unAlumno.validate();
    const unAlumnoValidado = await Alumno.create(req.body);
    res.json({ id: unAlumnoValidado.id });
  } catch (error) {
    console.error(error);
    res.status(409).json({
      errores: error.errors.map(function (e) {
        return e.message;
      }),
    });
  }
});

app.patch("/Alumnos/:id", async (req, res) => {
  const { id } = req.params;
  const unAlumno = req.body;

  try {
    const [, affectedRows] = await Alumno.update(unAlumno, { where: { id } });
    if (affectedRows === 0) {
      res.status(404).json({ error: `No se encontró el Alumno con ID ${id}.` });
    } else {
      res.json({ id: id });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ha ocurrido un error al actualizar los datos." });
  }
});

app.delete("/Alumnos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const unAlumno = await Alumno.findOne({ where: { id } });
    if (!unAlumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }
    await unAlumno.destroy();
    res.json("ok");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/Alumnos/:id/Cursada", async (req, res) => {
  const { id } = req.params;
  try {
    const unaCursada = await Cursada.build({...req.body, alumnoId: id});
    await unaCursada.validate();
    const unaCursadaValidada = await Cursada.create({...req.body, alumnoId: id});
    res.json({ id: unaCursadaValidada.id });
  } catch (error) {
    console.error(error);
    res.status(409).json({
      errores: error.errors.map(function (e) {
        return e.message;
      }),
    });
  }
});

app.patch("/Cursada/Aprobar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [, affectedRows] = await Cursada.update({aprobada: true}, { where: { id } });
    if (affectedRows === 0) {
      res.status(404).json({ error: `No se encontró la cursada con ID ${id}.` });
    } else {
      res.json({ id: id });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ha ocurrido un error al actualizar los datos." });
  }
});
app.patch("/Cursada/Reprobar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [, affectedRows] = await Cursada.update({aprobada: false}, { where: { id } });
    if (affectedRows === 0) {
      res.status(404).json({ error: `No se encontró la cursada con ID ${id}.` });
    } else {
      res.json({ id: id });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ha ocurrido un error al actualizar los datos." });
  }
});

app.delete("/Cursada/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const unaCursada = await Cursada.findOne({ where: { id } });
    if (!unaCursada) {
      return res.status(404).json({ error: "Cursada no encontrada" });
    }
    await unaCursada.destroy();
    res.json("ok");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});





async function popular() {
  const qAlumnos = await Alumno.count();
  const qCursadas = await Cursada.count();
  if (qAlumnos == 0 && qCursadas == 0) {
    const alumnos = [
      { nombre: "Jimi Hendrix", email: "Jimi@Hendrix.com", fecha_nacimiento: new Date() },
     { nombre: "Carlos Tevez", email: "carlos@tevez.com", fecha_nacimiento: new Date() },
     { nombre: "Post Malone", email: "post@malone.com", fecha_nacimiento: new Date() },
     { nombre: "Jimmy Kimmel", email: "Jimmi@kimmel.com", fecha_nacimiento: new Date() },
    ];

    const cursadas = [
      { materia: "Historia", anio: 1953, cuatrimestre: 2, aprobada: true, alumnoId: 1 },
      { materia: "Matermatica", anio: 2001, cuatrimestre: 1, aprobada: false, alumnoId: 2 },
      { materia: "Lengua", anio: 2009, cuatrimestre: 1, aprobada: true, alumnoId: 3 },
      { materia: "Ingles", anio: 1998, cuatrimestre: 2, aprobada: false, alumnoId: 4 },
      
    ];
    Alumno.bulkCreate(alumnos, { validate: true });
    Cursada.bulkCreate(cursadas, { validate: true });
  }
}
