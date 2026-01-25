from esperanto import LanguageModel
from langchain_core.language_models.chat_models import BaseChatModel
from loguru import logger

from open_notebook.domain.models import model_manager
from open_notebook.utils import token_count


async def provision_langchain_model(
    content, model_id, default_type, **kwargs
) -> BaseChatModel:
    """
    Returns the best model to use based on the context size and on whether there is a specific model being requested in Config.
    If context > 105_000, returns the large_context_model
    If model_id is specified in Config, returns that model
    Otherwise, returns the default model for the given type
    """
    tokens = token_count(content)

    model = None
    try:
        if tokens > 105_000:
            logger.debug(
                f"Using large context model because the content has {tokens} tokens"
            )
            model = await model_manager.get_default_model("large_context", **kwargs)
        elif model_id:
            logger.debug(f"Attempting to use specified model: {model_id}")
            model = await model_manager.get_model(model_id, **kwargs)
        else:
            logger.debug(f"Using default model for type: {default_type}")
            model = await model_manager.get_default_model(default_type, **kwargs)
    except Exception as e:
        logger.warning(f"Failed to get requested model (model_id={model_id}, type={default_type}): {e}")
        # Fallback to chat model if specified model fails
        if default_type != "chat":
            logger.info("Falling back to default chat model")
            try:
                model = await model_manager.get_default_model("chat", **kwargs)
            except Exception as chat_error:
                logger.error(f"Failed to get fallback chat model: {chat_error}")
                raise RuntimeError(f"No available models. Please configure at least one model in settings.") from chat_error

    if model is None:
        raise RuntimeError(f"Failed to provision model (model_id={model_id}, type={default_type}). Please configure models in settings.")

    logger.debug(f"Using model: {model}")
    assert isinstance(model, LanguageModel), f"Model is not a LanguageModel: {model}"
    return model.to_langchain()
