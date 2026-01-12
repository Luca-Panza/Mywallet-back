import express, { json } from "express";
import cors from "cors";
import indexRouter from "./routes/index.routes.js";

const app = express();
app.use(cors());
app.use(json());

app.use(indexRouter);
app.get("/health", (req, res) => {
  res.send("OK!");
});

// Exportar app para testes
export default app;

// Iniciar servidor apenas se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Port:${port}/`));
}
