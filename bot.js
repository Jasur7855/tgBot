const TelegramBot = require('node-telegram-bot-api');

// Замените на свой токен
const token = '7093681684:AAFb1IP4_aZQVndA8sxHfdykjiZ0PRbrivI';
const bot = new TelegramBot(token, { polling: true });

const userStates = {};

// Кнопки с действиями
const operationsKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '+', callback_data: '+' },
        { text: '-', callback_data: '-' },
        { text: '*', callback_data: '*' },
        { text: '/', callback_data: '/' },
      ],
    ],
  },
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = {}; // сбрасываем состояние
  bot.sendMessage(chatId, 'Выберите арифметическое действие:', operationsKeyboard);
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const operation = query.data;

  userStates[chatId] = { operation }; // сохраняем выбранную операцию
  bot.sendMessage(chatId, 'Введите первое число:');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем /start и другие команды
  if (text.startsWith('/')) return;

  const state = userStates[chatId];

  // Если операция выбрана, но первое число не введено
  if (state?.operation && state.firstNumber === undefined) {
    const num = parseFloat(text);
    if (isNaN(num)) return bot.sendMessage(chatId, 'Пожалуйста, введите корректное число.');
    state.firstNumber = num;
    bot.sendMessage(chatId, 'Введите второе число:');
  }
  // Если первое число уже есть, принимаем второе и считаем
  else if (state?.firstNumber !== undefined && state.secondNumber === undefined) {
    const num = parseFloat(text);
    if (isNaN(num)) return bot.sendMessage(chatId, 'Пожалуйста, введите корректное число.');
    state.secondNumber = num;

    const { operation, firstNumber, secondNumber } = state;

    let result;
    switch (operation) {
      case '+':
        result = firstNumber + secondNumber;
        break;
      case '-':
        result = firstNumber - secondNumber;
        break;
      case '*':
        result = firstNumber * secondNumber;
        break;
      case '/':
        result = secondNumber !== 0 ? firstNumber / secondNumber : 'Ошибка: деление на ноль';
        break;
    }

    bot.sendMessage(chatId, `${firstNumber} ${operation} ${secondNumber} = ${result}`);
    delete userStates[chatId]; 
  }
});
