module.exports = (bot, options) => {
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
        if (!Array.isArray(messageArray) || messageArray.length === 0) {
            return "";
        }
        const randomIndex = Math.floor(Math.random() * messageArray.length);
        return messageArray[randomIndex];
    };

    const PERMISSION_NAME = 'user.fly';
    const GROUP_NAME_MEMBER = 'Member';

    async function setupPermissions() {
        try {
            log('[FlyPlugin] Регистрация прав...');
            await bot.api.registerPermissions([{
                name: PERMISSION_NAME,
                description: 'Разрешает использовать команду /fly.',
                owner: 'plugin:fly-keksik'
            }]);

            if (bot.api.installedPlugins.includes('parser-keksik')) {
                log(`[FlyPlugin] Обнаружен 'parser-keksik'. Добавляем право '${PERMISSION_NAME}' в группу '${GROUP_NAME_MEMBER}'.`);
                await bot.api.addPermissionsToGroup(GROUP_NAME_MEMBER, [PERMISSION_NAME]);
            }
        } catch (error) {
            log(`[FlyPlugin] Ошибка при настройке прав: ${error.message}`);
        }
    }

    setupPermissions();

    class FlyCommand extends Command {
        constructor() {
            super({
                name: 'fly',
                description: 'Включает или выключает режим полета для игрока.',
                aliases: ['флай'],
                cooldown: 60,
                permissions: PERMISSION_NAME,
                owner: 'plugin:fly-keksik',
                allowedChatTypes: ['private', 'local', 'global', 'clan'],
                args: []
            });
        }

        async handler(bot, typeChat, user) {
            const successOnPattern = /^›\s*Установлен режим полета включен для/i;
            const successOffPattern = /^›\s*Установлен режим полета выключено для/i;
            const cooldownPattern = /^\[\*\]\s*Эта команда будет доступна через (\d+) секунд/i;

            try {
                const match = await bot.api.sendMessageAndWaitForReply(
                    `/fly ${user.username}`, 
                    [successOnPattern, successOffPattern, cooldownPattern], 
                    2000 
                );

                if (successOnPattern.test(match[0])) {
                    const template = getRandomMessage(messages.successOn);
                    const reply = template.replace('{username}', user.username);
                    bot.api.sendMessage(typeChat, reply, user.username);
                } else if (successOffPattern.test(match[0])) {
                    const template = getRandomMessage(messages.successOff);
                    const reply = template.replace('{username}', user.username);
                    bot.api.sendMessage(typeChat, reply, user.username);
                } else if (cooldownPattern.test(match[0])) {
                    const timeLeft = match[1];
                    const template = getRandomMessage(messages.cooldown);
                    const reply = template.replace('{username}', user.username).replace('{timeleft}', timeLeft);
                    bot.api.sendMessage(typeChat, reply, user.username);
                }

            } catch (error) {
                bot.sendLog(`[FlyPlugin] Ошибка: ${error.message}`);
                const template = getRandomMessage(messages.serverError);
                const reply = template.replace('{username}', user.username);
                bot.api.sendMessage(typeChat, reply, user.username);
            }
        }
    }

    const flyCommandInstance = new FlyCommand();
    if (bot.commands.has(flyCommandInstance.name)) {
         log(`[FlyPlugin] Внимание: Команда '${flyCommandInstance.name}' уже существует и будет перезаписана этим плагином.`);
    }
    bot.commands.set(flyCommandInstance.name, flyCommandInstance);

    log('[FlyPlugin] Плагин команды /fly успешно загружен и зарегистрирован.');

    bot.once('end', () => {
        if (bot.commands.get(flyCommandInstance.name) === flyCommandInstance) {
            bot.commands.delete(flyCommandInstance.name);
            log(`[FlyPlugin] Команда '${flyCommandInstance.name}' выгружена.`);
        }
    });
};