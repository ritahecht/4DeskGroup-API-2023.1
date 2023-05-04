const express = require("express");
const app = express();
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const shortid = require("shortid");

const cliente = new Pool({
  host: "localhost",
  user: "postgres",
  password: "1234",
  database: "visiona",
});

function buscaUsuario(login, senha, res) {
  cliente.query(
    "SELECT * FROM usuarios WHERE login = '" + login + "';",
    (err, result) => {
      if (err) {
        console.log("erro query:", err);
      }
      if (result.rows.length === 1) {
        const senhaUser = result.rows.values().next().value.senha;
        const tipoUser = result.rows.values().next().value.usuariotipo;
        const statusUser = result.rows.values().next().value.status;
        const idUser    = result.rows.values().next().value.id;
        bcrypt.compare(senha, senhaUser, function(err, result) {
          if (result && statusUser === 'ativo') {
            const mensagem = 'Usuário logado com sucesso'
            const data = {msg:mensagem, tipoUser:tipoUser, id:idUser}
            res.send(data);
          } else {
            res.send({ msg: "Usuário não encontrado" });
          }
        });
      } else {
        res.send({ msg: "Usuário não encontrado" });
      }
    }
  );
}

async function existeUser(login) {
  return new Promise((resolve, reject) => {
    cliente.query(
      "SELECT * FROM usuarios WHERE login = '" + login + "';",
      (err, result) => {
        if (err) {
          console.log("erro query:", err);
          reject(err);
        } else {
          resolve(result.rowCount > 0);
        }
      }
    );
  });
}

function setUsuario(
  login,
  nome,
  senha,
  email,
  status,
  usuariotipo,
  datacadastro,
  res
) {
  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) {
      res.send(err);
    } else {
      cliente.query(
        'insert into usuarios ("login", "nome", "senha", "email", "status", "usuariotipo", "datacadastro") values (' +
          "'" +
          login +
          "', '" +
          nome +
          "', '" +
          hash +
          "', '" +
          email +
          "', '" +
          status +
          "', '" +
          usuariotipo +
          "', '" +
          datacadastro +
          "');",
        (err, result) => {
          if (err) {
            console.log("erro SQL", err);
          }
        }
      );
    }
  });
}


function userAtivo(res) {
  cliente.query(
    "select * from usuarios where status = 'ativo';",
    (err, result) => {
      if (err) {
        console.log("erro query:", err);
      }
      var statusAtivo
      if (result.rows.length > 0) {
        statusAtivo = result.rows.length
        const userStatus= {userStatus:statusAtivo}
        res.send(userStatus)
      }else{
        let userStatus= {userStatus:0}
        res.send(userStatus)
      }
    }
  );
}

function userInativo(res) {
  cliente.query("select * from usuarios where status = 'inativo';",
    (err, result) => {
      if (err) {
        console.log("erro query:", err);
      }
      var statusInativo
      if (result.rows.length > 0) {
        statusInativo = result.rows.length
        //console.log(statusInativo + 'inativo')
        //localStorage.setItem('userInativo', statusInativo)
        const userStatus = {userStatus:statusInativo}
        res.send(userStatus)
      }
    }
  );
}


function populaUser(userId, res) {
  cliente.query(
    "SELECT * FROM usuarios WHERE id = " + userId + ";",
    (err, result) => {
      if (err) {
        console.log("erro query:", err);
      }
      if (result.rows.length === 1) {
        const senhaUser = result.rows.values().next().value.senha;
        const tipoUser = result.rows.values().next().value.usuariotipo;
        //const statusUser = result.rows.values().next().value.status;
        const nomeUser =  result.rows.values().next().value.nome;
        const loginUser = result.rows.values().next().value.login;
        const emailUser = result.rows.values().next().value.email;
        //const idUser    = result.rows.values().next().value.id;
        const mensagem = 'Usuário logado com sucesso'
        const data = {msg:mensagem, tipoUser:tipoUser, senha:senhaUser, nome:nomeUser, login:loginUser, email:emailUser }
            res.send(data);
          }else {
            res.send({ msg: "Usuário não encontrado" });
        }
    }
  );
}

function atualizaUser(login, nome, email, datacadastro, userId, tipo, res) {
  cliente.query(
    "UPDATE usuarios SET login = '" + login + "', nome = '" + nome + "', email = '" + email +  "', usuariotipo = '" + tipo + "', datacadastro = '" + datacadastro + "' WHERE id = " + userId + ";",
    (err, result) => {
      if (err) {
        console.log("erro SQL", err);
      } else{
         res.send({msg: "Usuário atualizado com sucesso."})
       };
    }
  );
}

function recuperaEmail(login, res){
  cliente.query("SELECT * FROM usuarios WHERE login = '" + login + "';", (err, result)=>{
    if(err){
      console.log("erro SQL RecuperaEmail:  ", err);
    }
    else{
      const emailUser = result.rows.values().next().value.email;
      const data = {emailUser: emailUser, msg:'Email pego com sucesso.'}
      res.send(data)
    }
  })
}

function alteraSenha(email,senha, res) {
  bcrypt.hash(senha, 10, (err, hash) => {
    if (err) {
      res.send(err);
    } else {
      cliente.query(
    "UPDATE usuarios SET senha = '" + hash + "' WHERE email = '" + email + "';",
    (err, result) => {
      if (err) {
        console.log("erro SQL", err);
        res.send({msg: "ERRO NA ALTERAÇÃO DA SENHA."})
      } else{
         res.send({msg: "Senha alterada com sucesso."})
       };
    }
    );
  }
});
}



app.use(cors());
app.use(express.json());

app.post("/procuraEmail", (req, res)=>{
  const { login } = req.body;

  recuperaEmail(login, res);
})

app.post("/login", (req, res) => {
  const login = req.body.login;
  const password = req.body.password;

  buscaUsuario(login, password, res);
});

app.post("/cadastro", async (req, res) => {
  const { firstname } = req.body;
  const { lastname } = req.body;
  const { login } = req.body;
  const { email } = req.body;
  const { password } = req.body;
  const { date } = req.body;
  const status = "ativo";
  const usuarioTipo = "NORMAL";

  const existee = await existeUser(login);

  if (existee === false) {
    setUsuario(
      login,
      firstname + " " + lastname,
      password,
      email,
      status,
      usuarioTipo,
      date,
      res
    );
    res.send({ msg: "Usuário cadastrado com sucesso." });
  } else {
    res.send({ msg: "Usuário ja cadastrado." });
  }
});

app.get("/getInfo", (req, res) => {
  cliente.query(
    "select * from usuarios ORDER BY dataCadastro DESC",
    (err, result) => {
      if (err) console.log(err);
      else res.json(result.rows);
    }
  );
});

// ativar/desativar usuário
app.delete("/usuarios/:login", (req, res) => {
  const login = req.params.login;
  cliente.query(
    `SELECT status FROM usuarios WHERE login = $1`,
    [login],
    (err, result) => {
      if (err) {
        console.log("erro query:", err);
        res.status(500).send({ msg: "Erro ao buscar usuário" });
      } else {
        if (result.rowCount === 0) {
          res.status(404).send({ msg: "Usuário não encontrado" });
        } else {
          const status = result.rows[0].status;
          if (status === "ativo") {
            cliente.query(
              `UPDATE usuarios SET status = 'inativo' WHERE login = $1`,
              [login],
              (err, result) => {
                if (err) {
                  console.log("erro query:", err);
                  res.status(500).send({ msg: "Erro ao desativar usuário" });
                } else {
                  res.send({ msg: "Usuário desativado com sucesso" });
                }
              }
            );
          } else {
            cliente.query(
              `UPDATE usuarios SET status = 'ativo' WHERE login = $1`,
              [login],
              (err, result) => {
                if (err) {
                  console.log("erro query:", err);
                  res.status(500).send({ msg: "Erro ao ativar usuário" });
                } else {
                  res.send({ msg: "Usuário ativado com sucesso" });
                }
              }
            );
          }
        }
      }
    }
  );
});

app.post('/editar', (req,res) => {
  const { userId } = req.body//localStorage.getItem('user');

  populaUser(userId, res)
})

app.post("/confirmarEditar", (req, res) => {
  const { firstname } = req.body;
  const { userId } = req.body
  const { login } = req.body;
  const { email } = req.body;
  const { tipo } = req.body;
  const  date = new Date().toLocaleString();

  atualizaUser(
    login,
    firstname, //+ " " + lastname,
    email,
    date,
    userId,
    tipo,
    res
  );
  });
  

app.get("/userAtivo", (req, res) => {

  userAtivo(res)
});
app.get("/userInativo", (req, res) => {

  userInativo(res)
});


app.post('/enviar-token', (req, res) => {
  const { email } = req.body

  shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#') // Define os caracters que vão estar no token
  const token = shortid.generate().substring(0,6); // Gera o token

  const transporter = nodemailer.createTransport({ // Configuração SMTP
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
      auth: {
          user: "fateccarlos@gmail.com",
          pass: "24g11r84"
      }
  });

  transporter.sendMail({ // Envia o Email
      from: 'fateccarlos@gmail.com',
      to: email, // Email destinatário
      subject: 'Visiona - token para alteração de senha',
      html: `Requisição de token para alteração de senha no sistema da Visiona.</br> Seu token é: <b>${token}</b>`
  })

  res.send({msg: "Sucesso", token: token})
});

app.post('/alterarSenha', (req, res)=>{
  const email = req.body.email;
  const password = req.body.password;

  alteraSenha(email, password, res)
});



app.listen(3001, () => {
  console.log("rodando servidor");
});