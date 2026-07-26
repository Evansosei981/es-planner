package com.example.evansunischeduler.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.evansunischeduler.ui.ai.NativeAiChatScreen
import com.example.evansunischeduler.ui.ai.GeminiViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EvansAiBottomSheet(
    viewModel: GeminiViewModel,
    onDismissRequest: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        sheetState = sheetState,
        modifier = Modifier.fillMaxWidth().height(700.dp) // Make it tall enough
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            NativeAiChatScreen(viewModel = viewModel)
        }
    }
}
