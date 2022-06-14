<?php

/**
 * Helper function for models.
 *
 */

use Springy\Validation\Validator;

/**
 * ModelHelperTraits trait.
 */
trait ModelHelperTraits
{
    /**
     * Registers a validation error with given message.
     *
     * @param string $message
     *
     * @return bool
     */
    protected function makeValidationError(string $message): bool
    {
        $validator = Validator::make(
            [
                'ok' => null,
            ],
            [
                'ok' => 'Required',
            ],
            [
                'ok' => [
                    'Required' => $message,
                ],
            ]
        );
        $result = $validator->validate();
        $this->validationErrors = $validator->errors();

        return $result;
    }

    /**
     * Remove HTML tags and trim trailing spaces from data content.
     *
     * @param string|null $data
     *
     * @return string|null
     */
    protected function trimTags(?string $data): ?string
    {
        if (is_null($data)) {
            return $data;
        }

        return trim(strip_tags($data));
    }
}
