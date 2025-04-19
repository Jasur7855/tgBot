const db = require("./db"); // подключаем базу данных
const TelegramBot = require("node-telegram-bot-api");

const token = "7634665312:AAGjsgemDnTE_REi7K2Qkj6f2lp-gWG1_1E";
const bot = new TelegramBot(token, { polling: true });

const userStates = {};

// Кнопки с действиями
const operationsKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "+", callback_data: "+" },
        { text: "-", callback_data: "-" },
        { text: "*", callback_data: "*" },
        { text: "/", callback_data: "/" },
      ],
      [{ text: "Все вычисления", callback_data: "history" }],
    ],
  },
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = {};
  bot.sendMessage(
    chatId,
    "Выберите арифметическое действие:",
    operationsKeyboard
  );
});

bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const operation = query.data;

  if (operation === "history") {
    // 🧠 Получаем историю операций пользователя
    db.all(
      `SELECT operation, first_number, second_number, result, created_at
       FROM operations WHERE chat_id = ? ORDER BY created_at DESC`,
      [chatId],
      (err, rows) => {
        if (err) {
          console.error("Ошибка при получении истории:", err);
          return bot.sendMessage(
            chatId,
            "Произошла ошибка при получении истории."
          );
        }

        if (rows.length === 0) {
          return bot.sendMessage(
            chatId,
            "У вас пока нет сохранённых вычислений."
          );
        }

        // Формируем текст
        const historyText = rows
          .map(
            (r) =>
              `${r.first_number} ${r.operation} ${r.second_number} = ${r.result} (${r.created_at})`
          )
          .join("\n");

        bot.sendMessage(chatId, `📜 Ваши вычисления:\n\n${historyText}`);
      }
    );

    return ; // прекращаем дальнейшую обработку
  }

  // Если выбрали обычную операцию:
  userStates[chatId] = { operation };
  bot.sendMessage(chatId, "Введите первое число:");
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем /start и другие команды
  if (text.startsWith("/")) return;

  const state = userStates[chatId];

  // Если операция выбрана, но первое число не введено
  if (state?.operation && state.firstNumber === undefined) {
    const num = parseFloat(text);
    if (isNaN(num))
      return bot.sendMessage(chatId, "Пожалуйста, введите корректное число.");
    state.firstNumber = num;
    bot.sendMessage(chatId, "Введите второе число:");
  }
  // Если первое число уже есть, принимаем второе и считаем
  else if (
    state?.firstNumber !== undefined &&
    state.secondNumber === undefined
  ) {
    const num = parseFloat(text);
    if (isNaN(num))
      return bot.sendMessage(chatId, "Пожалуйста, введите корректное число.");
    state.secondNumber = num;

    const { operation, firstNumber, secondNumber } = state;

    let result;
    switch (operation) {
      case "+":
        result = firstNumber + secondNumber;
        break;
      case "-":
        result = firstNumber - secondNumber;
        break;
      case "*":
        result = firstNumber * secondNumber;
        break;
      case "/":
        result =
          secondNumber !== 0
            ? firstNumber / secondNumber
            : "Ошибка: деление на ноль";
        break;
    }

    const resultMessage = `${firstNumber} ${operation} ${secondNumber} = ${result}`;
    bot.sendMessage(chatId, `Ваше арифметическое действие 
${resultMessage}`);

    // 💾 Сохраняем в базу данных
    db.run(
      `INSERT INTO operations (chat_id, operation, first_number, second_number, result)
   VALUES (?, ?, ?, ?, ?)`,
      [chatId, operation, firstNumber, secondNumber, result.toString()],
      (err) => {
        if (err) {
          console.error("Ошибка при сохранении в базу:", err);
        } else {
          console.log("Операция успешно сохранена в базу данных");
        }
      }
    );

    delete userStates[chatId];
  }
});
