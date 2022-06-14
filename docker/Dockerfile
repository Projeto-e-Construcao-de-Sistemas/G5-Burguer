FROM ubuntu:20.04

RUN apt-get update && \
    apt-get -y install software-properties-common \
    # xvfb \
    tzdata \
    locales && \
    locale-gen en_US.UTF-8 && \
    export LC_ALL=en_US.UTF-8 && \
    export LANG=en_US.UTF-8 && \
    # add-apt-repository ppa:ondrej/php && \
    # apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get -y --allow-unauthenticated install \
    apache2 \
    # php-apcu \
    # php-xdebug \
    php7.4 \
    php7.4-cli \
    php7.4-common \
    php7.4-curl \
    php7.4-gd \
    php7.4-json \
    php7.4-mbstring \
    php7.4-mysql \
    php7.4-opcache \
    php7.4-readline \
    # php7.4-pgsql \
    php7.4-soap \
    # php7.4-sqlite3 \
    php7.4-xml \
    php7.4-zip \
    libapache2-mod-php7.4 \
    # mysql-client \
    composer

# Enable apache mods.
RUN a2enmod php7.4
RUN a2enmod rewrite
RUN a2enmod cgi
RUN a2enmod headers
RUN usermod -u 1000 www-data
RUN usermod -G staff www-data

# Update the PHP.ini
RUN sed -i "s/session.gc_maxlifetime = 1440/session.gc_maxlifetime = 86400/" /etc/php/7.4/apache2/php.ini
RUN sed -i "s/display_errors = Off/display_errors = On /" /etc/php/7.4/apache2/php.ini

# RUN echo "ServerName localhost" | tee /etc/apache2/conf-available/servername.conf
# RUN a2enconf servername

# Manually set up the apache environment variables
# ENV APACHE_RUN_USER www-data
# ENV APACHE_RUN_GROUP www-data
# ENV APACHE_LOG_DIR /var/log/apache2
# ENV APACHE_LOCK_DIR /var/lock/apache2
# ENV APACHE_PID_FILE /var/run/apache2.pid
ENV TZ America/Sao_Paulo

# Expose apache.
EXPOSE 80

# Update the default apache site with the config we created.
ADD apache.conf /etc/apache2/sites-enabled/000-default.conf

# By default start up apache in the foreground, override with /bin/bash for interative.
CMD /usr/sbin/apache2ctl -D FOREGROUND