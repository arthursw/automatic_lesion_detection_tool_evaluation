import random
import json
from pathlib import Path
Path.ls = lambda x: list(x.iterdir())
import SimpleITK as sitk
import shutil

task_path = Path('/home/amasson/Data/Conception interface thèse Blandine/')
# task_archive_path = task_path.parent / f'{task_path.name}_archive'

# Initialize the fields which will be displayed on the table of the viewer
# Here there are two checkboxes "new" and "growing"
fields = [
]

# Deux sessions : 24 patients seront inversés lors des deux sessions, 6 seront identiques
# Parmis les 6 : 3 avec aide, 3 sans.

# This is the task
session1_task = { 'patients': [], 'fields': fields }
session2_task = { 'patients': [], 'fields': fields }

patients = sorted(list(task_path.iterdir()))
n_patients = len(patients)

total_similar_patients = 6
total_similar_patients_with_help = total_similar_patients // 2

n = 0

# For all patients: extract the patients and add them to the task
for patient in patients:
    print(patient.name)

    similar_patients = n < total_similar_patients
    with_help = n < total_similar_patients_with_help if similar_patients else random.choice([True, False])
    n += 1
    
    for session_task in [session1_task, session2_task]:
        
        # Load and threshold the ground truth
        phase_suffix = '2 (Avec aide)' if with_help else '1 (Sans aide)' 
        phase_path = (patient / 'Phase {phase_suffix}').relative_to(task_path)

        patient_name = f'{patient.name}'
        
        # The list of images for the patient with the following fields:
        # - parameters are Papaya images options (see https://github.com/rii-mango/Papaya/wiki/Configuration#image-options)
        #   see the trick to display label images with different colors using the same look-up table (LUT): max is different for the three experts
        # - display indicates if the image will be displayed by default or not
        images = [
            { 'name': 'time01', 'file': phase_path / 'flair_or1.nii.gz', 'parameters': {'minPercent': 0, 'maxPercent': 1, 'lut': 'Grayscale'}, 'display': True }, 
            { 'name': 'time02', 'file': phase_path / 'flair_or2.nii.gz', 'parameters': {'minPercent': 0, 'maxPercent': 1, 'lut': 'Grayscale'}, 'display': True }, 
        ]
        if with_help:
            images.append({ 'name': 'segmentation', 'file': phase_path / 'labelExpert3b_phase2.nii.gz', 'parameters': {'minPercent': 0, 'maxPercent': 1, 'lut': 'Green'}, 'display': True })

        session_task['patients'].append({
            'name': patient_name, 		                    # Each patient name must be unique, required to be able to retrieve the patient for later processes
            'images': images,								# The list of images for the patient
            'clinical_case': phase_path / 'clinical_case.pdf',
            'report': phase_path / 'report.txt',
        })

        if not similar_patients:
            with_help = not with_help

# Save the task	
for n, session_task in enumerate([session1_task, session2_task]):
    with open(str(task_path / f'task_session{n+1}.json'), 'w') as f:
        json.dump(session_task, f, indent=4)

# Archive the task
shutil.make_archive(str(task_path.parent / f'{task_path.name}'), 'zip', str(task_path))