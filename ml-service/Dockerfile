FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11

COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY ./simple_api.py /app/
COPY ./models/ /app/models/

EXPOSE 8001

CMD ["uvicorn", "simple_api:app", "--host", "0.0.0.0", "--port", "8001"]
