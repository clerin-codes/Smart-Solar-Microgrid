package lk.smartsolar.microgrid.ui.prosumer

import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Base64
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import lk.smartsolar.microgrid.R

/**
 * Fragment for displaying QR code to prosumers
 */
class QRDisplayFragment : Fragment() {

    private lateinit var viewModel: QRViewModel
    private lateinit var qrImageView: ImageView
    private lateinit var tokenTextView: TextView
    private lateinit var expiryTextView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var generateButton: Button
    private lateinit var refreshButton: Button
    private lateinit var cancelButton: Button
    private lateinit var errorTextView: TextView

    private var reservationId: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_qr_display, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        initializeViews(view)
        initializeViewModel()
        setupClickListeners()
        observeViewModel()

        // Get reservation ID from arguments
        reservationId = arguments?.getString("reservation_id") ?: ""

        // Auto-generate QR if reservation ID is provided
        reservationId?.let {
            if (it.isNotEmpty()) {
                viewModel.generateQRCode(it)
            }
        }
    }

    private fun initializeViews(view: View) {
        qrImageView = view.findViewById(R.id.qr_image_view)
        tokenTextView = view.findViewById(R.id.token_text_view)
        expiryTextView = view.findViewById(R.id.expiry_text_view)
        progressBar = view.findViewById(R.id.progress_bar)
        generateButton = view.findViewById(R.id.generate_button)
        refreshButton = view.findViewById(R.id.refresh_button)
        cancelButton = view.findViewById(R.id.cancel_button)
        errorTextView = view.findViewById(R.id.error_text_view)
    }

    private fun initializeViewModel() {
        viewModel = ViewModelProvider(this).get(QRViewModel::class.java)
    }

    private fun setupClickListeners() {
        generateButton.setOnClickListener {
            reservationId?.let {
                if (it.isNotEmpty()) {
                    viewModel.generateQRCode(it)
                }
            }
        }

        refreshButton.setOnClickListener {
            reservationId?.let {
                if (it.isNotEmpty()) {
                    viewModel.retryGeneration(it)
                }
            }
        }

        cancelButton.setOnClickListener {
            viewModel.clearQRData()
            activity?.onBackPressed()
        }
    }

    private fun observeViewModel() {
        // Observe QR generation state
        viewModel.qrGenerationState.observe(viewLifecycleOwner) { state ->
            when (state) {
                QRGenerationState.Loading -> {
                    progressBar.visibility = View.VISIBLE
                    qrImageView.visibility = View.GONE
                    tokenTextView.visibility = View.GONE
                    expiryTextView.visibility = View.GONE
                    errorTextView.visibility = View.GONE
                }
                QRGenerationState.Success -> {
                    progressBar.visibility = View.GONE
                    qrImageView.visibility = View.VISIBLE
                    tokenTextView.visibility = View.VISIBLE
                    expiryTextView.visibility = View.VISIBLE
                    generateButton.isEnabled = false
                }
                QRGenerationState.Error -> {
                    progressBar.visibility = View.GONE
                    errorTextView.visibility = View.VISIBLE
                    generateButton.isEnabled = true
                }
                else -> {}
            }
        }

        // Observe QR data
        viewModel.qrData.observe(viewLifecycleOwner) { qrData ->
            qrData?.let {
                displayQRCode(it)
            }
        }

        // Observe errors
        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                errorTextView.text = "Error: $it"
                Log.e("QRDisplayFragment", error)
            }
        }
    }

    private fun displayQRCode(qrData: QRDataModel) {
        try {
            // Decode Base64 image
            val decodedString = Base64.decode(qrData.base64Image, Base64.DEFAULT)
            val decodedBitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)
            qrImageView.setImageBitmap(decodedBitmap)

            // Display token
            tokenTextView.text = "Token: ${qrData.token.take(20)}..."

            // Display expiry
            expiryTextView.text = "Expires: ${qrData.expiresAt}"

            Toast.makeText(context, "QR Code generated successfully!", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Log.e("QRDisplayFragment", "Error displaying QR: ${e.message}")
            errorTextView.text = "Error displaying QR code"
            errorTextView.visibility = View.VISIBLE
        }
    }

    companion object {
        fun newInstance(reservationId: String): QRDisplayFragment {
            return QRDisplayFragment().apply {
                arguments = Bundle().apply {
                    putString("reservation_id", reservationId)
                }
            }
        }
    }
}
