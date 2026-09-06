const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");
const crypto = require("node:crypto");

initializeApp();

exports.verificarSenhaAdmin = onCall(
    {
      region: "southamerica-east1",
    },
    async (request) => {
      const senha = request.data && request.data.senha;

      if (typeof senha !== "string" || senha.length < 1 || senha.length > 200) {
        throw new HttpsError(
            "invalid-argument",
            "Senha inválida.",
        );
      }

      const db = getFirestore();

      const doc = await db
          .collection("configuracoes")
          .doc("admin")
          .get();

      if (!doc.exists) {
        throw new HttpsError(
            "failed-precondition",
            "Configuração administrativa não encontrada.",
        );
      }

      const dados = doc.data();

      const senhaHash = dados.senhaHash;
      const senhaSalt = dados.senhaSalt;

      if (!senhaHash || !senhaSalt) {
        throw new HttpsError(
            "failed-precondition",
            "Configuração da senha incompleta.",
        );
      }

      const saltBuffer = Buffer.from(senhaSalt, "hex");
      const hashSalvo = Buffer.from(senhaHash, "hex");

      const hashDigitado = crypto.pbkdf2Sync(
          senha,
          saltBuffer,
          310000,
          32,
          "sha256",
      );

      const senhaCorreta =
      hashSalvo.length === hashDigitado.length &&
      crypto.timingSafeEqual(hashSalvo, hashDigitado);

      if (!senhaCorreta) {
        throw new HttpsError(
            "permission-denied",
            "Senha incorreta.",
        );
      }

      const token = await getAuth().createCustomToken(
          "admin-atipicos",
          {
            admin: true,
          },
      );

      return {
        sucesso: true,
        token,
      };
    },
);
