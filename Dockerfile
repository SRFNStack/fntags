FROM nginx:alpine
COPY nginx.nginx /etc/nginx/nginx.conf
COPY docs/* /var/www/
RUN chmod 644 /etc/nginx/nginx.conf && chmod 644 /var/www/*

EXPOSE 80