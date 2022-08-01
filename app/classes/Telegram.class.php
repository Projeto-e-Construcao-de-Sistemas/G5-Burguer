<?php

/**
 * Base class for Telegram integration.
 *
 */

use Springy\Configuration;
use Springy\Errors;
use Springy\Kernel;
use TelegramBot\Api\BotApi;
use TelegramBot\Api\HttpException;
use TelegramBot\Api\InvalidJsonException;

/**
 * Base class for Telegram integration.
 */
class Telegram
{
    /// The bot object
    private $bot = null;

    /**
     * Constructor.
     */
    public function __construct()
    {
        if (!Configuration::get('app', 'integrations.telegram.enabled')) {
            return;
        }

        $this->bot = new TelegramBot(Configuration::get('app', 'integrations.telegram.token'));
    }

    /**
     * Sends message via Telegram.
     *
     * @param int|string  $chatId
     * @param string      $message
     * @param string|null $parseMode
     *
     * @return void
     */
    public function sendMessage(int $chatId, string $message, $parseMode = null)
    {
        if (!Configuration::get('app', 'integrations.telegram.enabled')) {
            return;
        }

        if ($chatId == 0) {
            return;
        }

        $errIds = [
            JSON_ERROR_DEPTH,
            JSON_ERROR_STATE_MISMATCH,
            JSON_ERROR_CTRL_CHAR,
            JSON_ERROR_SYNTAX,
            JSON_ERROR_UTF8
        ];

        Kernel::addIgnoredError($errIds);

        try {
            $this->bot->sendMessage($chatId, $message, $parseMode);
        } catch (Exception $err) {
            if (
                !($err instanceof InvalidJsonException)
                && !($err instanceof HttpException)
                && $err->getMessage()
            ) {
                Kernel::delIgnoredError($errIds);

                new Errors($err->getCode(), $err->getMessage());
            }
        }

        Kernel::delIgnoredError($errIds);
    }
}

/**
 * Extends the \TelegramBot\Api\BotApi class to implement timeout.
 */
class TelegramBot extends BotApi
{
    /**
     * Overrides the method to implement timeout.
     *
     * @param array $options
     */
    protected function executeCurl(array $options)
    {
        curl_setopt($this->curl, CURLOPT_TIMEOUT_MS, 2000);

        return parent::executeCurl($options);
    }
}
