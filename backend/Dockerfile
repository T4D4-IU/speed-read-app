# Use an official Deno runtime as a parent image
FROM denoland/deno:1.44.4

# Set the working directory in the container
WORKDIR /app

# Copy the backend application files into the container
COPY . /app

# Expose the port the Deno application listens on
# Assuming your Deno app listens on port 8000, adjust if necessary
EXPOSE 8000

# Command to run the Deno application
# --allow-net is needed for network access
# --allow-read is needed to read files (e.g., main.ts)
CMD ["deno", "run", "--allow-net", "--allow-read", "main.ts"]
