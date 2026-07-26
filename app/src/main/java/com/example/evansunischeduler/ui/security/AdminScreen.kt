package com.example.evansunischeduler.ui.security

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Key
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.example.evansunischeduler.security.SecurityManager
import com.example.evansunischeduler.theme.PrimaryAccent
import com.example.evansunischeduler.theme.SecondaryAccent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    onNavigateBack: () -> Unit
) {
    var password by remember { mutableStateOf("") }
    var isAuthenticated by remember { mutableStateOf(false) }
    var authError by remember { mutableStateOf(false) }

    // Hardcoded master password
    val MASTER_PASSWORD = "Evans"

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Admin Panel", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background),
            contentAlignment = Alignment.TopCenter
        ) {
            if (!isAuthenticated) {
                // Password prompt
                Card(
                    modifier = Modifier
                        .fillMaxWidth(0.9f)
                        .padding(top = 32.dp),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Filled.Key, contentDescription = "Admin", modifier = Modifier.size(64.dp), tint = SecondaryAccent)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Enter Master Password", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it; authError = false },
                            visualTransformation = PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth(),
                            isError = authError,
                            shape = RoundedCornerShape(12.dp)
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Button(
                            onClick = {
                                if (password == MASTER_PASSWORD) {
                                    isAuthenticated = true
                                } else {
                                    authError = true
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SecondaryAccent)
                        ) {
                            Text("Login")
                        }
                    }
                }
            } else {
                // Key Generator
                AdminGeneratorPanel()
            }
        }
    }
}

@Composable
fun AdminGeneratorPanel() {
    val context = LocalContext.current
    var inputHwId by remember { mutableStateOf("") }
    var generatedCode by remember { mutableStateOf<String?>(null) }

    Card(
        modifier = Modifier
            .fillMaxWidth(0.9f)
            .padding(top = 32.dp),
        shape = RoundedCornerShape(24.dp)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Key Generator", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = PrimaryAccent)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Enter a user's Hardware ID to generate their Activation Code.",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            OutlinedTextField(
                value = inputHwId,
                onValueChange = { inputHwId = it.uppercase() },
                label = { Text("Hardware ID (e.g. A7B-9X2)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Button(
                onClick = {
                    if (inputHwId.isNotBlank()) {
                        generatedCode = SecurityManager.generateActivationCode(inputHwId)
                    }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryAccent)
            ) {
                Text("Generate Code")
            }
            
            if (generatedCode != null) {
                Spacer(modifier = Modifier.height(32.dp))
                HorizontalDivider(color = Color.LightGray)
                Spacer(modifier = Modifier.height(24.dp))
                
                Text("Activation Code", style = MaterialTheme.typography.labelLarge)
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(12.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = generatedCode!!,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = SecondaryAccent
                    )
                    IconButton(onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("Activation Code", generatedCode))
                        android.widget.Toast.makeText(context, "Code copied", android.widget.Toast.LENGTH_SHORT).show()
                    }) {
                        Icon(Icons.Filled.ContentCopy, contentDescription = "Copy")
                    }
                }
            }
        }
    }
}
