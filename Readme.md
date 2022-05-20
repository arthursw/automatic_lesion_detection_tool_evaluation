# Evaluation tool

A nice tool to evaluate the benefits of using a patient detection tool.

## Usage

### User interfaces

![patient Viewer Screenshot](patientViewer.png)

The mouse enables to navigate in the image (click and drag on the different slices), as the arrow keys and the Page Up / Page Down keys.

To zoom in and out, click and drag up or down with the ALT key pressed.

The "Toggle side view" button enables to choose between a side-to-side view and a single view. The image checkboxes enable to show / hide each image.

The "< Prev" and "Next >" buttons enable to navigate in the patient list.

Papaya shortcuts (help menu > show keyboard reference):
```
[Spacebar] Cycle the main slice view in a clockwise rotation.
[Page Up] or ['] Increment the axial slice.
[Page Down] or [/] Decrement the axial slice.
[Arrow Up] and [Arrow Down] Increment/decrement the coronal slice.
[Arrow Right] and [Arrow Left] Increment/decrement the sagittal slice.
[g] and [v] Increment/decrement main slice.
[<] or [,] Decrement the series point.
[>] or [.] Increment the series point.
[o] Navigate viewer to the image origin.
[c] Navigate viewer to the center of the image.
[a] Toggle main crosshairs on/off.
```

### Create a task file to view a database

The `create_patient_list.py` script in this repository is an example to create a json task file.

A task file has the following structure:

```
{
	{
	"patients": [
		{
			"name": "patient01", 															# The patient name
			"description": "Patient: 8099YL-GMMZZO-0417OF-RMMMVC, patient: 5", 				# The patient description
			"images": [																		# The image list for this patient
				{
					"name": "time01",														# The name of the image
					"file": "8099YL-GMMZZO-0417OF-RMMMVC_flair_time01.nii.gz",				# The path of the image in the image archive or folder
					"parameters": {															# The [Papaya images options](https://github.com/rii-mango/Papaya/wiki/Configuration#image-options))
						"minPercent": 0,													# Can be min or minPercent
						"maxPercent": 1,													# Can be max or maxPercent, a nice trick is to use different max values on the same look-up table to display different label images with different colors
						"lut": "Grayscale"
					},
					"display": true 														# Wether to display the image by default or not
				},
				{
					"name": "time02",
					"file": "8099YL-GMMZZO-0417OF-RMMMVC_flair_time02.nii.gz",
					"parameters": {
						"minPercent": 0,
						"maxPercent": 1,
						"lut": "Grayscale"
					},
					"display": true
				},
				[...]
			]
		},
		[...]
	],
	"fields": [																				# The list of the custom fields in the patient table
		{
			"field": "new",																	# The field name
			"sortable": true,																# The column will be sortable
			"resizable": true,																# The column (width) will be resizable
			"filter": true,																	# Enable to filter the column
			"editable": true,																# Enable to edit values in the column
			"longiseg_type": "bool",														# Create a checkbox in the column for this boolean value
		},
		{
			"field": "growing",
			"sortable": true,
			"resizable": true,
			"filter": true,
			"editable": true,
			"longiseg_type": "bool",
		}
	]
}
}

```

The image archive or folder is just the place containing all images refered in the "images" attributes of the patients of a task. In the example above, the images folder must at least contain the images `8099YL-GMMZZO-0417OF-RMMMVC_flair_time01.nii.gz` and `8099YL-GMMZZO-0417OF-RMMMVC_flair_time02.nii.gz`. It can also contains other files.

