
#!/bin/sh
ollama serve &
sleep 5
ollama pull llama3
tail -f /dev/null