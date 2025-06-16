
const PERMISSION_NAME = 'user.fly';
const COMMAND_NAME = 'fly';
const PLUGIN_OWNER_ID = 'plugin:fly-keksik';
const MEMBER_GROUP_NAME = 'Member';

/**
 * Функция, выполняемая при запуске бота с этим плагином.
 */
async function onLoad(bot, options) {
    const log = bot.sendLog;
    const Command = bot.api.Command;
    
    const settings = options.settings || {};
    const messages = {
        successOn: settings.successOnMessages || ["Режим полета для вас включен, {username}."],
        successOff: settings.successOffMessages || ["Режим полета для вас выключен, {username}."],
        cooldown: settings.cooldownMessages || ["&cКоманда на перезарядке. Попробуйте через {timeleft} секунд."],
        serverError: settings.serverErrorMessages || ["❗️ Сервер не ответил на команду. Попробуйте еще раз."]
    };

    const getRandomMessage = (messageArray) => {
        if (!Array.isArray(messageArray) || messageArray.length === 0) return "";
        return messageArray[Math.floor(Math.random() * messageArray.length)];
    };

    class FlyCommand extends Command {
        constructor() {
            super({
                name: COMMAND_NAME,
                description: 'Включает или выключает режим полета для игрока.',
                aliases: ['флай'],
                cooldown: 60,
                permissions: PERMISSION_NAME,
                owner: PLUGIN_OWNER_ID,
                allowedChatTypes: ['clan'],
                args: []
            });
        }

        async handler(bot, typeChat, user) {
            const successOnPattern = /^(›|\|)\s*Установлен режим полета включен для/i;
            const successOffPattern = /^(›|\|)\s*Установлен режим полета выключено для/i;
            const cooldownPattern = /^\[\*\]\s*Эта команда будет доступна через (\d+) секунд/i;

            try {
                const match = await bot.api.sendMessageAndWaitForReply(
                    `/fly ${user.username}`, 
                    [successOnPattern, successOffPattern, cooldownPattern], 
                    2000 
                );

                if (successOnPattern.test(match[0])) {
                    const reply = getRandomMessage(messages.successOn).replace('{username}', user.username);
                    bot.api.sendMessage(typeChat, reply, user.username);
                } else if (successOffPattern.test(match[0])) {
                    const reply = getRandomMessage(messages.successOff).replace('{username}', user.username);
                    bot.api.sendMessage(typeChat, reply, user.username);
                } else if (cooldownPattern.test(match[0])) {
                    const timeLeft = match[1];
                    const reply = getRandomMessage(messages.cooldown).replace('{timeleft}', timeLeft);
                    bot.api.sendMessage(typeChat, reply, user.username);
                }
            } catch (error) {
                log(`[${PLUGIN_OWNER_ID}] Ошибка: ${error.message}`);
                const reply = getRandomMessage(messages.serverError).replace('{username}', user.username);
                bot.api.sendMessage(typeChat, reply, user.username);
            }
        }
    }

    try {
        await bot.api.registerCommand(new FlyCommand());
        
        if (bot.api.installedPlugins.includes('parser-keksik')) {
            log(`[${PLUGIN_OWNER_ID}] Добавляем право '${PERMISSION_NAME}' в группу '${MEMBER_GROUP_NAME}'.`);
            await bot.api.addPermissionsToGroup(MEMBER_GROUP_NAME, [PERMISSION_NAME]);
        }
    } catch (error) {
        log(`[${PLUGIN_OWNER_ID}] Критическая ошибка при регистрации команды: ${error.message}`);
    }
};

/**
 * Функция, выполняемая перед удалением плагина из системы.
 */
async function onUnload({ botId, prisma }) {
    console.log(`[${PLUGIN_OWNER_ID}] Начало процедуры удаления для бота ID: ${botId}`);
    try {
        const deletedCommand = await prisma.command.deleteMany({
            where: { botId, name: COMMAND_NAME, owner: PLUGIN_OWNER_ID },
        });
        if (deletedCommand.count > 0) {
            console.log(`[${PLUGIN_OWNER_ID}] Команда '${COMMAND_NAME}' успешно удалена из БД.`);
        }
        
        const deletedPermission = await prisma.permission.deleteMany({
            where: { botId, name: PERMISSION_NAME, owner: PLUGIN_OWNER_ID },
        });
        if (deletedPermission.count > 0) {
            console.log(`[${PLUGIN_OWNER_ID}] Право '${PERMISSION_NAME}' успешно удалено из БД.`);
        }
    } catch (error) {
        console.error(`[${PLUGIN_OWNER_ID}] Ошибка во время очистки ресурсов плагина:`, error);
    }
}

module.exports = {
    onLoad,
    onUnload
};
