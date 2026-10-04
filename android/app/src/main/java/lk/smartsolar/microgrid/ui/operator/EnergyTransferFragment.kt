package lk.smartsolar.microgrid.ui.operator

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import lk.smartsolar.microgrid.R

/**
 * Fragment for energy transfer confirmation
 */
class EnergyTransferFragment : Fragment() {

    private lateinit var viewModel: TransactionViewModel
    private lateinit var qrTokenInput: EditText
    private lateinit var reservationIdInput: EditText
    private lateinit var amountTextView: TextView
    private lateinit var unitsTextView: TextView
    private lateinit var statusTextView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var confirmButton: Button
    private lateinit var cancelButton: Button
    private lateinit var errorTextView: TextView
    private lateinit var successContainer: View

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_energy_transfer, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        initializeViews(view)
        initializeViewModel()
        setupClickListeners()
        observeViewModel()
    }

    private fun initializeViews(view: View) {
        qrTokenInput = view.findViewById(R.id.qr_token_input)
        reservationIdInput = view.findViewById(R.id.reservation_id_input)
        amountTextView = view.findViewById(R.id.amount_text_view)
        unitsTextView = view.findViewById(R.id.units_text_view)
        statusTextView = view.findViewById(R.id.status_text_view)
        progressBar = view.findViewById(R.id.progress_bar)
        confirmButton = view.findViewById(R.id.confirm_button)
        cancelButton = view.findViewById(R.id.cancel_button)
        errorTextView = view.findViewById(R.id.error_text_view)
        successContainer = view.findViewById(R.id.success_container)
    }

    private fun initializeViewModel() {
        viewModel = ViewModelProvider(this).get(TransactionViewModel::class.java)
    }

    private fun setupClickListeners() {
        confirmButton.setOnClickListener {
            val qrToken = qrTokenInput.text.toString().trim()
            val reservationId = reservationIdInput.text.toString().trim()

            if (validateInputs(qrToken, reservationId)) {
                viewModel.processEnergyTransfer(reservationId, qrToken)
            }
        }

        cancelButton.setOnClickListener {
            activity?.onBackPressed()
        }
    }

    private fun validateInputs(qrToken: String, reservationId: String): Boolean {
        return when {
            qrToken.isEmpty() -> {
                errorTextView.text = "QR Token is required"
                errorTextView.visibility = View.VISIBLE
                false
            }
            reservationId.isEmpty() -> {
                errorTextView.text = "Reservation ID is required"
                errorTextView.visibility = View.VISIBLE
                false
            }
            else -> true
        }
    }

    private fun observeViewModel() {
        // Observe transaction state
        viewModel.transactionState.observe(viewLifecycleOwner) { state ->
            when (state) {
                TransactionState.Processing -> {
                    progressBar.visibility = View.VISIBLE
                    confirmButton.isEnabled = false
                    errorTextView.visibility = View.GONE
                    successContainer.visibility = View.GONE
                }
                TransactionState.Success -> {
                    progressBar.visibility = View.GONE
                    successContainer.visibility = View.VISIBLE
                    confirmButton.isEnabled = true
                    Toast.makeText(context, "Energy transfer successful!", Toast.LENGTH_SHORT).show()
                }
                TransactionState.Error -> {
                    progressBar.visibility = View.GONE
                    errorTextView.visibility = View.VISIBLE
                    confirmButton.isEnabled = true
                }
                else -> {}
            }
        }

        // Observe current transaction
        viewModel.currentTransaction.observe(viewLifecycleOwner) { transaction ->
            transaction?.let {
                displayTransactionDetails(it)
            }
        }

        // Observe errors
        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                errorTextView.text = "Error: $it"
                Log.e("EnergyTransferFragment", error)
            }
        }
    }

    private fun displayTransactionDetails(transaction: TransactionModel) {
        amountTextView.text = "Amount: Rs. ${transaction.amount}"
        unitsTextView.text = "Units: ${transaction.units} kWh"
        statusTextView.text = "Status: ${transaction.status}"
    }

    companion object {
        fun newInstance(): EnergyTransferFragment {
            return EnergyTransferFragment()
        }
    }
}
