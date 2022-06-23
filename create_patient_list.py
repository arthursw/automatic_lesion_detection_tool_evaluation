import random
import json
from pathlib import Path
import shuti
import argparse


parser = argparse.ArgumentParser(
    prog=__file__,
    formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    description="""Create an evaluation task""")

parser.add_argument('-t', '--task_folder', required=True, help='Path to the patients folder. See the file structure in Readme.md.')

args = parser.parse_args()

task_path = Path(args.task_folder)

# task_archive_path = task_path.parent / f'{task_path.name}_archive'

# Initialize the fields which will be displayed on the table of the viewer
# Here there are two checkboxes "new" and "growing"
fields = [
]

# Deux sessions : 24 patients seront inversés lors des deux sessions, 6 seront identiques
# Parmis les 6 : 3 avec aide, 3 sans.

# This is the task
session1_task = { 'patients': [], 'fields': fields, 'name': 'session1' }
session2_task = { 'patients': [], 'fields': fields, 'name': 'session2' }

patients = sorted(list(task_path.iterdir()))
n_patients = len(patients)

total_duplicated_patients = 3
patients_session1_with_help = []
patients_session2_without_help = []

n = 0

random.seed(0)

# For all patients: extract the patients and add them to the task
for patient in patients:
    if not patient.is_dir(): continue
    print(patient.name)

    with_help = random.choice([True, False])
    n += 1
    
    for session_task in [session1_task, session2_task]:
        
        # Load and threshold the ground truth
        patient_relative = patient.relative_to(task_path)

        patient_name = f'{patient.name}'
        
        # The list of images for the patient with the following fields:
        # - parameters are Papaya images options (see https://github.com/rii-mango/Papaya/wiki/Configuration#image-options)
        #   see the trick to display label images with different colors using the same look-up table (LUT): max is different for the three experts
        # - display indicates if the image will be displayed by default or not
        images = [
            { 'name': 'time01', 'file': str(patient_relative / 'flair1.nii.gz'), 'parameters': {'minPercent': 0, 'maxPercent': 1, 'lut': 'Grayscale'}, 'display': True }, 
            { 'name': 'time02', 'file': str(patient_relative / 'flair2.nii.gz'), 'parameters': {'minPercent': 0, 'maxPercent': 1, 'lut': 'Grayscale'}, 'display': True }, 
        ]
        if with_help:
            images.append({ 'name': 'segmentation', 'file': str(patient_relative / 'segmentation.nii.gz'), 'parameters': {'minPercent': 0, 'maxPercent': 1, 'lut': 'Green Overlay'}, 'display': True })

        patient_data = {
            'name': patient_name, 		                    # Each patient name must be unique, required to be able to retrieve the patient for later processes
            'images': images,								# The list of images for the patient
            'clinical_case': str(patient_relative / 'clinical_case.txt'),
            'report': str(patient_relative / 'report.pdf'),
        }
        session_task['patients'].append(patient_data)

        if with_help and len(patients_session1_with_help) < total_duplicated_patients and session_task == session1_task:
            patients_session1_with_help.append(patient_data)
        if not with_help and len(patients_session2_without_help) < total_duplicated_patients and session_task == session2_task:
            patients_session2_without_help.append(patient_data)

        with_help = not with_help

for patient in patients_session1_with_help:
    session1_task['patients'].append(patient)
for patient in patients_session2_without_help:
    session2_task['patients'].append(patient)

# shutil.copytree(task_path, task_path.parent  / 'session2')

# Save the tasks and make sessions archive
for n, session_task in enumerate([session1_task, session2_task]):
    random.shuffle(session_task['patients'])
    
    session_path = task_path.parent / f'session{n+1}'

    # session_path.mkdir(exist_ok=True, parents=True)

    with open(str(session_path / f'task_session{n+1}.json'), 'w') as f:
        json.dump(session_task, f, indent=4)

    shutil.make_archive(str(session_path), 'zip', str(session_path))