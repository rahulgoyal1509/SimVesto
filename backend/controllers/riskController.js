import Simulation from '../models/Simulation.js';

export const getRiskInsights = async (req, res) => {
  try {
    const simulationId = req.params.simulationId;
    const simulation = await Simulation.findOne({ _id: simulationId, userId: req.user._id });
    
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    res.json({
      probLoss: simulation.result.probLoss,
      worstCase: simulation.input.investment - simulation.result.maxLoss,
      originalInvestment: simulation.input.investment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAiExplanation = async (req, res) => {
    try {
        const { result } = req.body;
        // Simulating LLM integration as discussed
        let text = "Here is an AI explanation of your risk: ";
        
        if (result.probLoss > 50) {
            text += `With a probability of loss at ${result.probLoss}%, this is a highly risky portfolio. Your maximum projected loss is $${result.maxLoss}.`;
        } else if (result.probLoss > 20) {
            text += `This is a moderately balanced portfolio. You have a ${result.probLoss}% chance of losing capital over the duration.`;
        } else {
            text += `This is a conservative portfolio layout. It projects safe returns with only a ${result.probLoss}% risk of loss.`;
        }

        res.json({ explanation: text });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
