import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
import numpy as np
from sklearn.model_selection import train_test_split
import json

# Configuration
DATASET_PATHS = {
    'Apple': r'C:\Users\DEEPAK KUMAR K\.gemini\antigravity-ide\scratch\agrishield-crop-ai\backend\app\ml\datasets\Apple\datasets\train',
    'Corn': r'C:\Users\DEEPAK KUMAR K\.gemini\antigravity-ide\scratch\agrishield-crop-ai\backend\app\ml\datasets\Corn\data',
    'Tomato': r'C:\Users\DEEPAK KUMAR K\.gemini\antigravity-ide\scratch\agrishield-crop-ai\backend\app\ml\datasets\Tomato\tomato\train'
}

# Class mapping from dataset folders to our target classes
CLASS_MAPPING = {
    # Apple dataset
    'apple_scab': 'Apple Scab',
    
    # Corn dataset  
    'Common_Rust': 'Corn Common Rust',
    
    # Tomato dataset
    'Tomato___Late_blight': 'Tomato Late Blight',
    'Tomato___healthy': 'Tomato Healthy'
}

# Target classes (in order)
TARGET_CLASSES = [
    'Tomato Late Blight',
    'Apple Scab', 
    'Corn Common Rust',
    'Grape Black Rot',  # Will need separate data
    'Tomato Healthy'
]

NUM_CLASSES = len(TARGET_CLASSES)
BATCH_SIZE = 32
NUM_EPOCHS = 20
LEARNING_RATE = 0.001
IMG_SIZE = 224

class PlantDiseaseDataset(Dataset):
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        image = Image.open(self.image_paths[idx]).convert('RGB')
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

def get_data_transforms():
    return {
        'train': transforms.Compose([
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(10),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'val': transforms.Compose([
            transforms.Resize((IMG_SIZE, IMG_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    }

def load_and_prepare_data():
    '''Load images from datasets and prepare for training'''
    image_paths = []
    labels = []
    
    print('Loading dataset...')
    
    for dataset_name, base_path in DATASET_PATHS.items():
        if not os.path.exists(base_path):
            print(f'Warning: {dataset_name} dataset path does not exist: {base_path}')
            continue
            
        print(f'Processing {dataset_name} dataset...')
        
        # Get all subdirectories (classes) in this dataset
        class_folders = [f for f in os.listdir(base_path) 
                        if os.path.isdir(os.path.join(base_path, f))]
        
        for class_folder in class_folders:
            class_path = os.path.join(base_path, class_folder)
            
            # Check if this class maps to one of our target classes
            if class_folder in CLASS_MAPPING:
                target_class = CLASS_MAPPING[class_folder]
                class_idx = TARGET_CLASSES.index(target_class)
                
                # Get all image files in this class folder
                image_files = [f for f in os.listdir(class_path) 
                              if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff'))]
                
                print(f'  Found {len(image_files)} images for {class_folder} -> {target_class}')
                
                for img_file in image_files:
                    img_path = os.path.join(class_path, img_file)
                    image_paths.append(img_path)
                    labels.append(class_idx)
            else:
                print(f'  Skipping {class_folder} (not in target classes)')
    
    print(f'Total loaded: {len(image_paths)} images across {len(set(labels))} classes')
    return image_paths, labels

def train_model():
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')
    
    # Load and prepare data
    image_paths, labels = load_and_prepare_data()
    
    if len(image_paths) == 0:
        print('Error: No images found! Check dataset paths.')
        return
    
    # Split data
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        image_paths, labels, test_size=0.2, random_state=42, stratify=labels
    )
    
    print(f'Training samples: {len(train_paths)}')
    print(f'Validation samples: {len(val_paths)}')
    
    # Get transforms
    data_transforms = get_data_transforms()
    
    # Create datasets
    train_dataset = PlantDiseaseDataset(train_paths, train_labels, data_transforms['train'])
    val_dataset = PlantDiseaseDataset(val_paths, val_labels, data_transforms['val'])
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
    
    # Load pre-trained ResNet50
    model = models.resnet50(pretrained=True)
    
    # Replace the final fully connected layer
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, NUM_CLASSES)
    
    model = model.to(device)
    
    # Loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)
    
    # Training loop
    best_acc = 0.0
    train_losses = []
    val_losses = []
    train_accs = []
    val_accs = []
    
    for epoch in range(NUM_EPOCHS):
        print(f'Epoch {epoch+1}/{NUM_EPOCHS}')
        print('-' * 10)
        
        # Each epoch has a training and validation phase
        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
                dataloader = train_loader
            else:
                model.eval()
                dataloader = val_loader
            
            running_loss = 0.0
            running_corrects = 0
            
            # Iterate over data
            for inputs, labels in dataloader:
                inputs = inputs.to(device)
                labels = labels.to(device)
                
                # Zero the parameter gradients
                optimizer.zero_grad()
                
                # Forward pass
                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)
                    
                    # Backward pass + optimize only if in training phase
                    if phase == 'train':
                        loss.backward()
                        optimizer.step()
                
                # Statistics
                loss = loss.item()
                running_loss += loss * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)
            
            if phase == 'train':
                scheduler.step()
            
            epoch_loss = running_loss / len(dataloader.dataset)
            epoch_acc = running_corrects.double() / len(dataloader.dataset)
            
            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')
            
            # Save metrics
            if phase == 'train':
                train_losses.append(epoch_loss)
                train_accs.append(epoch_acc.item())
            else:
                val_losses.append(epoch_loss)
                val_accs.append(epoch_acc.item())
                
                # Deep copy the model
                if epoch_acc > best_acc:
                    best_acc = epoch_acc
                    torch.save(model.state_dict(), 
                              'C:\\Users\\DEEPAK KUMAR K\\.gemini\\antigravity-ide\\scratch\\agrishield-crop-ai\\backend\\app\\ml\\models\\resnet50_classifier.pth')
                    print('Saved best model!')
    
    print(f'Training complete! Best val accuracy: {best_acc:.4f}')
    
    # Save training history
    history = {
        'train_loss': train_losses,
        'val_loss': val_losses,
        'train_acc': train_accs,
        'val_acc': val_accs
    }
    
    with open('C:\\Users\\DEEPAK KUMAR K\\.gemini\\antigravity-ide\\scratch\\agrishield-crop-ai\\backend\\app\\ml\\training_history.json', 'w') as f:
        json.dump(history, f)
    
    print('Training history saved!')

if __name__ == '__main__':
    train_model()
