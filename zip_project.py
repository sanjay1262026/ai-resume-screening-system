import os
import zipfile

def create_zip_archive():
    zip_filename = "ai_resume_screening_system.zip"
    
    # Files and subdirectories to package
    files_to_zip = [
        "app.py",
        "generate_samples.py",
        "zip_project.py",
        "requirements.txt",
        "Procfile",
        ".gitignore",
        "README.md",
    ]
    
    dirs_to_zip = [
        "assets",
        "components",
        "modules",
        "sample_data",
        ".streamlit"
    ]

    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add root files
        for f in files_to_zip:
            if os.path.exists(f):
                zipf.write(f, f)
                
        # Add subdirectories preserving directory structure
        for d in dirs_to_zip:
            if os.path.exists(d):
                for root, _, files in os.walk(d):
                    for file in files:
                        if file.endswith(('.py', '.css', '.txt', '.pdf', '.docx', '.md', '.json', '.yaml', '.toml')):
                            file_path = os.path.join(root, file)
                            zipf.write(file_path, file_path)

    print(f"ZIP archive {zip_filename} created successfully! Size: {os.path.getsize(zip_filename)} bytes")

if __name__ == "__main__":
    create_zip_archive()
