<?php

/**
 * Base class for send mail.
 *
 */

use Springy\Mail;

/**
 * Base class for send mail.
 */
class StandardMail extends Mail
{
    private $transactTemplate = false;
    private $mailSubject = '';
    private $substitutionTags = [];

    /**
     * Constructor method.
     *
     * Extends the default constructor and initialize internal properties.
     *
     * @param string      $name
     * @param string|null $from
     * @param string|null $subject
     */
    public function __construct(string $name, $from = null, $subject = null)
    {
        parent::__construct();

        $conf = config_get('app.mail.' . $name);

        // Set from
        if (!is_array($from) || !config_get('mail.can_set_from')) {
            $from = [
                config_get('mail.app_sender_mail') => config_get('mail.app_sender_name')
            ];
        }
        $this->from(key($from), current($from));

        // Has an transactional template?
        if ($conf['mail_template'] ?? false) {
            $this->transactTemplate = $conf['mail_template'];
        }

        // Subject?
        if ($subject) {
            $this->mailSubject = $subject;
        } elseif ($conf['subject'] ?? false) {
            $this->mailSubject = $conf['subject'];
        }

        // Category
        if ($conf['category'] ?? false) {
            $this->addCategory($conf['category']);
        }
    }

    /**
     * Sets variables to external template system.
     *
     * @param string $tag
     * @param mixed  $value
     *
     * @return void
     */
    public function substitutionTag($tag, $value = null)
    {
        if (is_array($tag)) {
            foreach ($tag as $key => $value) {
                $this->substitutionTags[$key] = $value;
            }

            return;
        }

        $this->substitutionTags[$tag] = $value;
    }

    /**
     * Initializes the body, variables and send the message.
     */
    public function send($body = '')
    {
        // Adjust substitution tags in subject text
        $subject = $this->mailSubject;
        foreach ($this->substitutionTags as $tag => $value) {
            if (is_array($value)) {
                continue;
            }

            $subject = str_replace($tag, $value, $subject);
        }
        $this->subject($subject);

        // Set transactional template
        if ($this->transactTemplate) {
            $this->setTemplate($this->transactTemplate);
            foreach ($this->substitutionTags as $tag => $value) {
                $this->addTemplateVar($tag, $value);
            }
        }

        $this->body($body, '');
        return parent::send();
    }
}
