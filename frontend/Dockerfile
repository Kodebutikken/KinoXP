FROM nginx:alpine

ENV BACKEND_URL=http://host.docker.internal:8080

COPY index.html /usr/share/nginx/html/index.html
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
