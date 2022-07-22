<?php

/**
 * Controller class for Telegram Bot.
 *
 * This program is experimental.
 *
 */

use Springy\Configuration;
use Springy\Kernel;
use Springy\URI;
use Springy\Utils\JSON;
use TelegramBot\Api\Types\Chat;
use TelegramBot\Api\Types\Message;
use TelegramBot\Api\Types\Update;

class Telegram_Bot_Controller extends BaseRESTController
{
    protected $authenticationNeeded = false;

    private $bot = null;
    private $json = null;

    /**
     * Constructor.
     */
    public function __construct()
    {
        header('Content-Type: application/json; charset=UTF-8', true);

        $this->bot = new \TelegramBot\Api\BotApi(Configuration::get('app', 'integrations.telegram.token'));
        $this->json = new JSON();

        Configuration::set('system', 'debug', false);

        parent::__construct();
    }

    /**
     * Gets a predefined reply to received message.
     *
     * @param string $text
     *
     * @return string
     */
    private function getReply(string $text): string
    {
        $replies = [
            '^o(i(i*|e)|l(a|á))[.!]*$' => 'Oi!',
            '^como vai( voc[eê])?[?.]*$' => 'Vou bem, obrigado!',
        ];

        foreach ($replies as $message => $reply) {
            if (preg_match_all('/' . $message . '/miu', $text, $matches, PREG_SET_ORDER, 0)) {
                return $reply;
            }
        }

        return '';
    }

    /**
     * Notifies the administrator about an update received.
     *
     * @param Chat   $chat
     * @param string $text
     *
     * @return void
     */
    private function notifyAdmin(Chat $chat, string $text)
    {
        $this->bot->sendMessage(
            Configuration::get('app', 'integrations.telegram.notifications.admin'),
            sprintf(
                "AVISO!\nRecebi a seguinte mensagem de\nID: %s\nTipo: %s\n\n'%s'\n",
                $chat->getid(),
                $chat->getType(),
                $text
            )
        );
    }


    /**
     * Process a received message.
     *
     * @param Message $message
     *
     * @return void
     */
    private function processMessage(Message $message)
    {
        $chat = $message->getChat();
        $text = $message->getText();

        if ($this->processCommand($chat, $text)) {
            return;
        }

        if ($reply = $this->getReply($text)) {
            $this->sendReply($chat, $reply);

            return;
        }

        $this->notifyAdmin($chat, $text);
    }

    /**
     * Process and reply updates.
     *
     * @param array $updates
     *
     * @return void
     */
    private function processUpdates($updates)
    {
        $len = count($updates) - 1;
        foreach ($updates as $index => $update) {
            echo '{"update_id":', $update->getUpdateId(), ',';
            echo '"message":{"message_id":', $update->getMessage()->getMessageId(), ',';
            echo '"chat":{"id":', $update->getMessage()->getChat()->getId();
            echo ',"last_name":"', $update->getMessage()->getChat()->getLastName();
            echo '","first_name":"', $update->getMessage()->getChat()->getFirstName();
            echo '","username":"', $update->getMessage()->getChat()->getUsername();
            echo '"},"from":{"user_id":', $update->getMessage()->getFrom()->getId();
            echo ',"first_name":"', $update->getMessage()->getFrom()->getFirstName();
            echo '","last_name":"', $update->getMessage()->getFrom()->getLastName();
            echo '","username":"', $update->getMessage()->getFrom()->getUsername(), '"}}';
            echo '}', ($index == $len ? '' : ',');

            $this->processMessage($update->getMessage());
        }
    }

    /**
     * Help command.
     *
     * @param Chat $chat
     *
     * @return void
     */
    private function replyToHelp(Chat $chat)
    {
        $this->sendReply(
            $chat,
            'Foi mal! Estou meio ocupado aqui e não posso ajudar agora. Quem sabe mais tarde... bem mais tarde.'
            . "\n\xF0\x9F\x98\x81"
        );
    }

    /**
     * Identify command.
     *
     * @param Chat $chat
     *
     * @return void
     */
    private function replyToIdentify(Chat $chat)
    {
        $this->bot->sendMessage(
            Configuration::get('app', 'integrations.telegram.notifications.admin'),
            sprintf(
                "Salve!\nRecebi um comando de identificação.\nAí vai:\nID: %s\nTipo: %s\n",
                $chat->getid(),
                $chat->getType()
            )
        );
        $this->sendReply(
            $chat,
            "Ok! Mandei a identificação pro administrador.\n" .
            "\xF0\x9F\x98\x81"
        );
    }

    /**
     * Sends a reply to the chat.
     *
     * @param Chat   $chat
     * @param string $reply
     *
     * @return void
     */
    private function sendReply(Chat $chat, string $reply)
    {
        $chatId = $chat->getId();

        $this->bot->sendMessage($chatId, $reply);
    }

    /**
     * Gets the updates from Telegram.
     *
     * @return void
     */
    public function getUpdates()
    {
        echo '{"updates":[';

        $this->processUpdates($this->bot->getUpdates());

        echo ']}';
    }

    /**
     * Calls method getMe in Telegram Bot API.
     *
     * @return void
     */
    public function getMe()
    {
        $result = $this->bot->getMe();
        dd($result);
    }

    /**
     * Method to receibe webhook notifications.
     *
     * @return void
     */
    public function notify()
    {
        // if (!$this->isPost()) {
            // $this->_killBadRequest();
        // }

        $token = URI::getSegment(1);
        if (!$token) {
            $this->_killBadRequest();
        } elseif ($token != Configuration::get('app', 'integrations.telegram.token')) {
            $this->_killForbidden();
        }

        if (!$this->body) {
            $this->_killBadRequest();
        }

        $update = new Update();
        if (!$update->validate($this->body)) {
            $this->_killBadRequest();
        }

        Kernel::addIgnoredError(0);
        try {
            $update->map($this->body);
        } catch (Exception $err) {
            $this->_killBadRequest();
        }

        $this->processMessage($update->getMessage());

        echo '{"ok":true}';
    }

    /**
     * Sets the webhook for the Telegram Bot.
     *
     * @return void
     */
    public function setWebhook()
    {
        $url = URI::buildURL(
            ['telegram-bot', 'notify'],
            [],
            false,
            'store'
        ) . '/' . Configuration::get(
            'app',
            'integrations.telegram.token'
        );

        $result = $this->bot->setWebhook($url);
        dd($result);
    }

    /**
     * Removes the webhook for the Telegram Bot.
     *
     * @return void
     */
    public function removeWebhook()
    {
        $result = $this->bot->setWebhook();
        dd($result);
    }
}
