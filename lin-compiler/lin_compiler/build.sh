#!/bin/sh

# Run dotnet build
dotnet build

# Check if the build was successful
if [ $? -eq 0 ]; then
    # Specify the output folder of the build
    OUTPUT_DIR="bin/Debug" # Change this to the appropriate path for your project
    
    # Specify the name of the .exe file
    EXE_NAME="lin_compiler.exe" # Replace with your actual .exe name
    
    # Specify the destination folder where you want to move the .exe
    DESTINATION_FOLDER="$HOME/Desktop/Danganronpa/path/programs" # Change to your desired folder
    
    # Move the .exe file to the destination folder
    mv "$OUTPUT_DIR/$EXE_NAME" "$DESTINATION_FOLDER"
fi
